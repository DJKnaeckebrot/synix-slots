-- Public leaderboard reads without opening profiles RLS to everyone.
-- Safe columns only; metrics whitelisted in-function.

create or replace function public.get_leaderboard(
  p_metric text,
  p_limit int default 25
)
returns table (
  rank bigint,
  id uuid,
  username text,
  avatar_url text,
  value numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select
      p.id,
      p.username,
      p.avatar_url,
      p.updated_at,
      case p_metric
        when 'credits' then p.credits::numeric
        when 'biggest_win' then p.biggest_win::numeric
        when 'highest_multiplier' then p.highest_multiplier
        else null::numeric
      end as value
    from public.profiles p
  ),
  ranked as (
    select
      row_number() over (
        order by s.value desc nulls last, s.updated_at asc, s.id asc
      )::bigint as rank,
      s.id,
      s.username,
      s.avatar_url,
      s.value
    from scored s
    where s.value is not null
  )
  select r.rank, r.id, r.username, r.avatar_url, r.value
  from ranked r
  order by r.rank
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

create or replace function public.get_my_leaderboard_rank(
  p_metric text,
  p_user_id uuid
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select
      case p_metric
        when 'credits' then p.credits::numeric
        when 'biggest_win' then p.biggest_win::numeric
        when 'highest_multiplier' then p.highest_multiplier
        else null::numeric
      end as value,
      p.updated_at,
      p.id
    from public.profiles p
    where p.id = p_user_id
  )
  select
    case
      when (select value from me) is null then null
      else (
        select count(*)::bigint + 1
        from public.profiles p
        where
          case p_metric
            when 'credits' then p.credits::numeric
            when 'biggest_win' then p.biggest_win::numeric
            when 'highest_multiplier' then p.highest_multiplier
            else null::numeric
          end > (select value from me)
          or (
            case p_metric
              when 'credits' then p.credits::numeric
              when 'biggest_win' then p.biggest_win::numeric
              when 'highest_multiplier' then p.highest_multiplier
              else null::numeric
            end = (select value from me)
            and (
              p.updated_at < (select updated_at from me)
              or (p.updated_at = (select updated_at from me) and p.id < (select id from me))
            )
          )
      )
    end;
$$;

revoke all on function public.get_leaderboard(text, int) from public;
revoke all on function public.get_my_leaderboard_rank(text, uuid) from public;
grant execute on function public.get_leaderboard(text, int) to anon, authenticated;
grant execute on function public.get_my_leaderboard_rank(text, uuid) to anon, authenticated;
