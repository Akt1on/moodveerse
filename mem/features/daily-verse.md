---
name: Daily Verse & Rituals
description: Стих дня — детерминированно подбирается по дате + времени суток (утро/день/вечер/ночь), с эмоциональным фильтром под ритуал. Кэшируется в localStorage по date+part.
type: feature
---

## Edge function: `daily-verse`
- GET `?lang=ru&tz=<minutes_east_of_utc>`
- Делит сутки на 4 части: morning (5–12), day (12–17), evening (17–22), night (22–5).
- Каждой части соответствует набор «ритуальных» эмоций (надежда/благодарность/тишина и т.д.).
- Из `literary_works` тянет пул по языку + overlaps(emotions_tags); fallback — любые работы языка → любые работы.
- Детерминированный выбор: `dayHash(date|part|lang) % pool.length` — внутри одной части суток стих не меняется.

## UI: `DailyVerse`
- Рендерится на главной над формой настроения.
- Кэш `moodverse_daily_v1` по `{date, part}` — повторные визиты в тот же отрезок дня не бьют сеть.
- Карточка: иконка времени (Sunrise/Sun/Sunset/Moon) + интро + первые 6 строк + автор/год.

## Расширение: TTS
Если в будущем добавить кнопку озвучки — переиспользовать `tts-speak` edge function.
