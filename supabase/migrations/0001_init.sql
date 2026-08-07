-- Rank Rush: initial schema, RLS, profile bootstrap, spin idempotency skeleton.
-- Virtual credits only — no real-money gambling.

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  discord_id text unique,
  credits bigint not null default 1000 check (credits >= 0),
  total_spins bigint not null default 0 check (total_spins >= 0),
  total_wagered bigint not null default 0 check (total_wagered >= 0),
  total_won bigint not null default 0 check (total_won >= 0),
  biggest_win bigint not null default 0 check (biggest_win >= 0),
  highest_multiplier numeric not null default 0 check (highest_multiplier >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_discord_id_idx on public.profiles (discord_id);

-- ---------------------------------------------------------------------------
-- Slot spins (append-only from server / RPC; clients read own history)
-- ---------------------------------------------------------------------------
create table public.slot_spins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_request_id uuid not null,
  bet bigint not null check (bet > 0),
  payout bigint not null default 0 check (payout >= 0),
  multiplier numeric not null default 0 check (multiplier >= 0),
  feature_type text,
  grid jsonb not null,
  wheel_results jsonb not null default '[]'::jsonb,
  winning_lines jsonb not null default '[]'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  constraint slot_spins_client_request_id_key unique (client_request_id)
);

create index slot_spins_user_id_created_at_idx
  on public.slot_spins (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Feature sessions (one active session per user)
-- ---------------------------------------------------------------------------
create table public.feature_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature_type text not null
    check (feature_type in ('overtime', 'champion', 'grand_champion', 'road_to_ssl')),
  spins_remaining int not null check (spins_remaining >= 0),
  spins_total int not null check (spins_total > 0),
  feature_win bigint not null default 0 check (feature_win >= 0),
  status text not null default 'active'
    check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index feature_sessions_one_active_per_user
  on public.feature_sessions (user_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger feature_sessions_set_updated_at
  before update on public.feature_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup (1000 virtual credits)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_avatar text;
  v_discord text;
begin
  v_username := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'user_name',
    split_part(coalesce(new.email, 'player'), '@', 1)
  );
  v_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
  v_discord := coalesce(
    new.raw_user_meta_data ->> 'provider_id',
    new.raw_user_meta_data ->> 'sub'
  );

  insert into public.profiles (id, username, avatar_url, discord_id, credits)
  values (new.id, v_username, v_avatar, v_discord, 1000)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.slot_spins enable row level security;
alter table public.feature_sessions enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Economy fields are mutated only by security-definer RPC / service role.
-- No direct client updates on profiles (cosmetic updates can be a later RPC).
revoke insert, update, delete on public.profiles from authenticated;

-- Spins: users may read own history only. No client inserts/updates.
create policy "slot_spins_select_own"
  on public.slot_spins for select
  to authenticated
  using (auth.uid() = user_id);

create policy "feature_sessions_select_own"
  on public.feature_sessions for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- execute_spin skeleton
-- Locks profile, enforces idempotency, validates bet.
-- Full RNG / engine settlement is applied by the Next.js service role in STEP 4;
-- this RPC provides the transactional shell for debit + insert + credit.
-- ---------------------------------------------------------------------------
create or replace function public.execute_spin(
  p_bet bigint,
  p_client_request_id uuid,
  p_result jsonb,
  p_dev_override jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_existing public.slot_spins%rowtype;
  v_payout bigint;
  v_multiplier numeric;
  v_feature_type text;
  v_spin_id uuid;
  v_balance_after bigint;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Dev overrides must never be accepted from clients in production paths.
  -- App server should only pass overrides when NODE_ENV=development.
  if p_dev_override is not null then
    raise exception 'dev_overrides_not_allowed_via_rpc';
  end if;

  if p_bet is null or p_bet <= 0 then
    raise exception 'invalid_bet';
  end if;

  if p_client_request_id is null then
    raise exception 'missing_client_request_id';
  end if;

  if p_result is null then
    raise exception 'missing_result';
  end if;

  -- Idempotency: retrying the same request never creates another spin.
  select * into v_existing
  from public.slot_spins
  where client_request_id = p_client_request_id;

  if found then
    if v_existing.user_id <> v_user_id then
      raise exception 'client_request_id_conflict';
    end if;
    return jsonb_build_object(
      'idempotent', true,
      'spin', to_jsonb(v_existing),
      'balance_after', (
        select credits from public.profiles where id = v_user_id
      )
    );
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if v_profile.credits < p_bet then
    raise exception 'insufficient_credits';
  end if;

  v_payout := coalesce((p_result ->> 'payout')::bigint, 0);
  v_multiplier := coalesce((p_result ->> 'finalMultiplier')::numeric, 0);
  v_feature_type := p_result -> 'feature' ->> 'type';

  if v_payout < 0 then
    raise exception 'invalid_payout';
  end if;

  update public.profiles
  set
    credits = credits - p_bet + v_payout,
    total_spins = total_spins + 1,
    total_wagered = total_wagered + p_bet,
    total_won = total_won + v_payout,
    biggest_win = greatest(biggest_win, v_payout),
    highest_multiplier = greatest(highest_multiplier, v_multiplier),
    updated_at = now()
  where id = v_user_id
  returning credits into v_balance_after;

  insert into public.slot_spins (
    user_id,
    client_request_id,
    bet,
    payout,
    multiplier,
    feature_type,
    grid,
    wheel_results,
    winning_lines,
    result
  )
  values (
    v_user_id,
    p_client_request_id,
    p_bet,
    v_payout,
    v_multiplier,
    v_feature_type,
    coalesce(p_result -> 'grid', '[]'::jsonb),
    coalesce(p_result -> 'wheels', '[]'::jsonb),
    coalesce(p_result -> 'paylines', '[]'::jsonb),
    p_result
  )
  returning id into v_spin_id;

  return jsonb_build_object(
    'idempotent', false,
    'spin_id', v_spin_id,
    'balance_after', v_balance_after,
    'result', p_result
  );
exception
  when unique_violation then
    -- Concurrent duplicate client_request_id: return the winner row.
    select * into v_existing
    from public.slot_spins
    where client_request_id = p_client_request_id;

    return jsonb_build_object(
      'idempotent', true,
      'spin', to_jsonb(v_existing),
      'balance_after', (
        select credits from public.profiles where id = v_user_id
      )
    );
end;
$$;

revoke all on function public.execute_spin(bigint, uuid, jsonb, jsonb) from public;
grant execute on function public.execute_spin(bigint, uuid, jsonb, jsonb) to authenticated;
grant execute on function public.execute_spin(bigint, uuid, jsonb, jsonb) to service_role;

-- Prevent clients from inserting spins directly.
revoke insert, update, delete on public.slot_spins from authenticated;
revoke insert, update, delete on public.feature_sessions from authenticated;