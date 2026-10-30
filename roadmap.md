# Roadmap

- [ ] Отключить фоновые задачи сборщика (`moodverse-harvest-work` каждые 10 мин, `moodverse-harvest-plan` ежедневно) — заблокировано: база на паузе до 1 ноября. Сразу после возобновления выполнить:
  `SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname LIKE 'moodverse-harvest-%';`
- [ ] После этого запускать сборщик классиков только вручную.
