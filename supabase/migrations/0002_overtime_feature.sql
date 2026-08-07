-- Allow Overtime free-game feature sessions.
alter table public.feature_sessions
  drop constraint if exists feature_sessions_feature_type_check;

alter table public.feature_sessions
  add constraint feature_sessions_feature_type_check
  check (
    feature_type in (
      'overtime',
      'champion',
      'grand_champion',
      'road_to_ssl'
    )
  );
