import type { SeedPiece } from "./seed-data.ts";

// Public-domain English poetry & prose. Russian-language emotion tags for unified vocabulary.

export const SEED_EN: SeedPiece[] = [
  // ===== Emily Dickinson =====
  {
    external_id: "en-dickinson-hope",
    language: "en", source_type: "poem",
    author: "Emily Dickinson", title: "Hope is the thing with feathers", year: 1861,
    emotions_tags: ["надежда", "утешение", "тишина", "вера"],
    text: "Hope is the thing with feathers —\nThat perches in the soul —\nAnd sings the tune without the words —\nAnd never stops — at all —\n\nAnd sweetest — in the Gale — is heard —\nAnd sore must be the storm —\nThat could abash the little Bird\nThat kept so many warm —",
  },
  {
    external_id: "en-dickinson-pain",
    language: "en", source_type: "poem",
    author: "Emily Dickinson", title: "Pain has an Element of Blank", year: 1862,
    emotions_tags: ["боль", "оцепенение", "одиночество", "тишина"],
    text: "Pain — has an Element of Blank —\nIt cannot recollect\nWhen it begun — or if there were\nA time when it was not —\n\nIt has no Future — but itself —\nIts Infinite contain\nIts Past — enlightened to perceive\nNew Periods — of Pain.",
  },
  {
    external_id: "en-dickinson-because",
    language: "en", source_type: "poem",
    author: "Emily Dickinson", title: "Because I could not stop for Death", year: 1863,
    emotions_tags: ["смирение", "тишина", "смерть", "покой", "преображение"],
    text: "Because I could not stop for Death —\nHe kindly stopped for me —\nThe Carriage held but just Ourselves —\nAnd Immortality.\n\nWe slowly drove — He knew no haste\nAnd I had put away\nMy labor and my leisure too,\nFor His Civility —",
  },

  // ===== Walt Whitman =====
  {
    external_id: "en-whitman-song-myself-1",
    language: "en", source_type: "poem",
    author: "Walt Whitman", title: "Song of Myself, 1", year: 1855,
    emotions_tags: ["вдохновение", "свобода", "принятие", "радость", "единство"],
    text: "I celebrate myself, and sing myself,\nAnd what I assume you shall assume,\nFor every atom belonging to me as good belongs to you.\n\nI loafe and invite my soul,\nI lean and loafe at my ease observing a spear of summer grass.",
  },
  {
    external_id: "en-whitman-noiseless",
    language: "en", source_type: "poem",
    author: "Walt Whitman", title: "A Noiseless Patient Spider", year: 1868,
    emotions_tags: ["одиночество", "поиск", "надежда", "тишина"],
    text: "A noiseless patient spider,\nI mark'd where on a little promontory it stood isolated,\nMark'd how to explore the vacant vast surrounding,\nIt launch'd forth filament, filament, filament, out of itself,\nEver unreeling them, ever tirelessly speeding them.\n\nAnd you O my soul where you stand,\nSurrounded, detached, in measureless oceans of space,\nCeaselessly musing, venturing, throwing, seeking the spheres to connect them,\nTill the bridge you will need be form'd, till the ductile anchor hold,\nTill the gossamer thread you fling catch somewhere, O my soul.",
  },

  // ===== Robert Frost =====
  {
    external_id: "en-frost-road",
    language: "en", source_type: "poem",
    author: "Robert Frost", title: "The Road Not Taken", year: 1916,
    emotions_tags: ["выбор", "сожаление", "свобода", "размышление"],
    text: "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nI shall be telling this with a sigh\nSomewhere ages and ages hence:\nTwo roads diverged in a wood, and I —\nI took the one less traveled by,\nAnd that has made all the difference.",
  },
  {
    external_id: "en-frost-stopping",
    language: "en", source_type: "poem",
    author: "Robert Frost", title: "Stopping by Woods on a Snowy Evening", year: 1923,
    emotions_tags: ["тишина", "усталость", "красота", "долг", "одиночество"],
    text: "Whose woods these are I think I know.\nHis house is in the village though;\nHe will not see me stopping here\nTo watch his woods fill up with snow.\n\nThe woods are lovely, dark and deep,\nBut I have promises to keep,\nAnd miles to go before I sleep,\nAnd miles to go before I sleep.",
  },

  // ===== Mary Oliver =====
  {
    external_id: "en-oliver-wild-geese",
    language: "en", source_type: "poem",
    author: "Mary Oliver", title: "Wild Geese", year: 1986,
    emotions_tags: ["принятие", "утешение", "одиночество", "свобода", "любовь"],
    text: "You do not have to be good.\nYou do not have to walk on your knees\nfor a hundred miles through the desert repenting.\nYou only have to let the soft animal of your body\nlove what it loves.\n\nMeanwhile the world goes on.\nMeanwhile the wild geese, high in the clean blue air,\nare heading home again.\nWhoever you are, no matter how lonely,\nthe world offers itself to your imagination,\ncalls to you like the wild geese, harsh and exciting —\nover and over announcing your place\nin the family of things.",
  },
  {
    external_id: "en-oliver-summer-day",
    language: "en", source_type: "poem",
    author: "Mary Oliver", title: "The Summer Day", year: 1990,
    emotions_tags: ["вдохновение", "благодарность", "присутствие", "вопрос"],
    text: "I don't know exactly what a prayer is.\nI do know how to pay attention, how to fall down\ninto the grass, how to kneel down in the grass,\nhow to be idle and blessed, how to stroll through the fields,\nwhich is what I have been doing all day.\nTell me, what else should I have done?\nDoesn't everything die at last, and too soon?\nTell me, what is it you plan to do\nwith your one wild and precious life?",
  },

  // ===== W.B. Yeats =====
  {
    external_id: "en-yeats-when-old",
    language: "en", source_type: "poem",
    author: "W. B. Yeats", title: "When You Are Old", year: 1893,
    emotions_tags: ["любовь", "потеря", "сожаление", "тоска", "память"],
    text: "When you are old and grey and full of sleep,\nAnd nodding by the fire, take down this book,\nAnd slowly read, and dream of the soft look\nYour eyes had once, and of their shadows deep;\n\nHow many loved your moments of glad grace,\nAnd loved your beauty with love false or true,\nBut one man loved the pilgrim soul in you,\nAnd loved the sorrows of your changing face.",
  },
  {
    external_id: "en-yeats-second-coming",
    language: "en", source_type: "poem",
    author: "W. B. Yeats", title: "The Second Coming", year: 1919,
    emotions_tags: ["тревога", "страх", "распад", "пророчество"],
    text: "Turning and turning in the widening gyre\nThe falcon cannot hear the falconer;\nThings fall apart; the centre cannot hold;\nMere anarchy is loosed upon the world,\nThe blood-dimmed tide is loosed, and everywhere\nThe ceremony of innocence is drowned;\nThe best lack all conviction, while the worst\nAre full of passionate intensity.",
  },

  // ===== T.S. Eliot =====
  {
    external_id: "en-eliot-prufrock",
    language: "en", source_type: "poem",
    author: "T. S. Eliot", title: "The Love Song of J. Alfred Prufrock", year: 1915,
    emotions_tags: ["тревога", "одиночество", "сомнение", "усталость"],
    text: "I have measured out my life with coffee spoons;\nI know the voices dying with a dying fall\nBeneath the music from a farther room.\nSo how should I presume?\n\nAnd I have known the eyes already, known them all —\nThe eyes that fix you in a formulated phrase,\nAnd when I am formulated, sprawling on a pin,\nWhen I am pinned and wriggling on the wall,\nThen how should I begin?",
  },

  // ===== Rilke (English translation) =====
  {
    external_id: "en-rilke-go-to-limits",
    language: "en", source_type: "poem",
    author: "Rainer Maria Rilke", title: "Go to the Limits of Your Longing", year: 1905,
    emotions_tags: ["вдохновение", "страх", "вера", "тоска", "преображение"],
    text: "God speaks to each of us as he makes us,\nthen walks with us silently out of the night.\n\nThese are the words we dimly hear:\n\nYou, sent out beyond your recall,\ngo to the limits of your longing.\nEmbody me.\n\nFlare up like a flame\nand make big shadows I can move in.\n\nLet everything happen to you: beauty and terror.\nJust keep going. No feeling is final.\nDon't let yourself lose me.\n\nNearby is the country they call life.\nYou will know it by its seriousness.\n\nGive me your hand.",
  },

  // ===== Derek Walcott =====
  {
    external_id: "en-walcott-love-after",
    language: "en", source_type: "poem",
    author: "Derek Walcott", title: "Love After Love", year: 1976,
    emotions_tags: ["принятие", "возвращение", "любовь", "исцеление", "одиночество"],
    text: "The time will come\nwhen, with elation,\nyou will greet yourself arriving\nat your own door, in your own mirror,\nand each will smile at the other's welcome,\n\nand say, sit here. Eat.\nYou will love again the stranger who was your self.\nGive wine. Give bread. Give back your heart\nto itself, to the stranger who has loved you\n\nall your life, whom you ignored\nfor another, who knows you by heart.",
  },

  // ===== Rumi (Coleman Barks translation) =====
  {
    external_id: "en-rumi-guest-house",
    language: "en", source_type: "poem",
    author: "Rumi", title: "The Guest House", year: 1273,
    emotions_tags: ["принятие", "смирение", "тревога", "радость", "благодарность"],
    text: "This being human is a guest house.\nEvery morning a new arrival.\n\nA joy, a depression, a meanness,\nsome momentary awareness comes\nas an unexpected visitor.\n\nWelcome and entertain them all!\nEven if they are a crowd of sorrows,\nwho violently sweep your house\nempty of its furniture,\nstill, treat each guest honorably.\nHe may be clearing you out\nfor some new delight.",
  },

  // ===== Wendell Berry =====
  {
    external_id: "en-berry-peace-wild-things",
    language: "en", source_type: "poem",
    author: "Wendell Berry", title: "The Peace of Wild Things", year: 1968,
    emotions_tags: ["тревога", "утешение", "природа", "тишина", "покой"],
    text: "When despair for the world grows in me\nand I wake in the night at the least sound\nin fear of what my life and my children's lives may be,\nI go and lie down where the wood drake\nrests in his beauty on the water, and the great heron feeds.\nI come into the peace of wild things\nwho do not tax their lives with forethought\nof grief. I come into the presence of still water.\nAnd I feel above me the day-blind stars\nwaiting with their light. For a time\nI rest in the grace of the world, and am free.",
  },

  // ===== Shakespeare =====
  {
    external_id: "en-shakespeare-sonnet-29",
    language: "en", source_type: "poem",
    author: "William Shakespeare", title: "Sonnet 29", year: 1609,
    emotions_tags: ["одиночество", "сожаление", "любовь", "благодарность", "преображение"],
    text: "When, in disgrace with fortune and men's eyes,\nI all alone beweep my outcast state,\nAnd trouble deaf heaven with my bootless cries,\nAnd look upon myself and curse my fate, —\n\nYet in these thoughts myself almost despising,\nHaply I think on thee, — and then my state,\nLike to the lark at break of day arising\nFrom sullen earth, sings hymns at heaven's gate;\n\nFor thy sweet love remember'd such wealth brings\nThat then I scorn to change my state with kings.",
  },
  {
    external_id: "en-shakespeare-sonnet-116",
    language: "en", source_type: "poem",
    author: "William Shakespeare", title: "Sonnet 116", year: 1609,
    emotions_tags: ["любовь", "верность", "вечность", "вера"],
    text: "Let me not to the marriage of true minds\nAdmit impediments. Love is not love\nWhich alters when it alteration finds,\nOr bends with the remover to remove:\nO no! it is an ever-fixed mark\nThat looks on tempests and is never shaken;\nIt is the star to every wandering bark,\nWhose worth's unknown, although his height be taken.",
  },

  // ===== Langston Hughes =====
  {
    external_id: "en-hughes-mother-to-son",
    language: "en", source_type: "poem",
    author: "Langston Hughes", title: "Mother to Son", year: 1922,
    emotions_tags: ["упорство", "надежда", "усталость", "любовь", "сила"],
    text: "Well, son, I'll tell you:\nLife for me ain't been no crystal stair.\nIt's had tacks in it,\nAnd splinters,\nAnd boards torn up,\nAnd places with no carpet on the floor —\nBare.\nBut all the time\nI'se been a-climbin' on,\nAnd reachin' landin's,\nAnd turnin' corners,\nAnd sometimes goin' in the dark\nWhere there ain't been no light.\nSo boy, don't you turn back.",
  },

  // ===== Maya Angelou =====
  {
    external_id: "en-angelou-still-i-rise",
    language: "en", source_type: "poem",
    author: "Maya Angelou", title: "Still I Rise", year: 1978,
    emotions_tags: ["сила", "гнев", "достоинство", "надежда", "свобода"],
    text: "You may write me down in history\nWith your bitter, twisted lies,\nYou may trod me in the very dirt\nBut still, like dust, I'll rise.\n\nJust like moons and like suns,\nWith the certainty of tides,\nJust like hopes springing high,\nStill I'll rise.",
  },

  // ===== Auden =====
  {
    external_id: "en-auden-funeral-blues",
    language: "en", source_type: "poem",
    author: "W. H. Auden", title: "Funeral Blues", year: 1938,
    emotions_tags: ["потеря", "горе", "любовь", "опустошение"],
    text: "Stop all the clocks, cut off the telephone,\nPrevent the dog from barking with a juicy bone,\nSilence the pianos and with muffled drum\nBring out the coffin, let the mourners come.\n\nHe was my North, my South, my East and West,\nMy working week and my Sunday rest,\nMy noon, my midnight, my talk, my song;\nI thought that love would last for ever: I was wrong.",
  },

  // ===== Thoreau (prose quote) =====
  {
    external_id: "en-thoreau-desperation",
    language: "en", source_type: "quote",
    author: "Henry David Thoreau", title: "Walden", year: 1854,
    emotions_tags: ["отчаяние", "смирение", "свобода", "пробуждение"],
    text: "The mass of men lead lives of quiet desperation. What is called resignation is confirmed desperation. From the desperate city you go into the desperate country, and have to console yourself with the bravery of minks and muskrats.",
  },

  // ===== Camus =====
  {
    external_id: "en-camus-invincible-summer",
    language: "en", source_type: "quote",
    author: "Albert Camus", title: "Return to Tipasa", year: 1952,
    emotions_tags: ["надежда", "сила", "преображение", "стойкость"],
    text: "In the midst of winter, I found there was, within me, an invincible summer. And that makes me happy. For it says that no matter how hard the world pushes against me, within me, there's something stronger — something better, pushing right back.",
  },

  // ===== Rilke (Letters to a Young Poet) =====
  {
    external_id: "en-rilke-questions",
    language: "en", source_type: "quote",
    author: "Rainer Maria Rilke", title: "Letters to a Young Poet", year: 1903,
    emotions_tags: ["терпение", "сомнение", "вера", "ожидание"],
    text: "Be patient toward all that is unsolved in your heart and try to love the questions themselves, like locked rooms and like books that are now written in a very foreign tongue. Do not now seek the answers, which cannot be given you because you would not be able to live them. And the point is, to live everything. Live the questions now.",
  },

  // ===== Films =====
  {
    external_id: "en-film-shawshank-hope",
    language: "en", source_type: "film",
    author: "Frank Darabont", title: "The Shawshank Redemption", year: 1994,
    emotions_tags: ["надежда", "свобода", "стойкость"],
    text: "Remember, Red. Hope is a good thing, maybe the best of things. And no good thing ever dies.",
  },
  {
    external_id: "en-film-blade-runner-tears",
    language: "en", source_type: "film",
    author: "Rutger Hauer / Hampton Fancher", title: "Blade Runner", year: 1982,
    emotions_tags: ["потеря", "память", "смерть", "красота"],
    text: "I've seen things you people wouldn't believe. Attack ships on fire off the shoulder of Orion. I watched C-beams glitter in the dark near the Tannhäuser Gate. All those moments will be lost in time, like tears in rain. Time to die.",
  },
  {
    external_id: "en-film-good-will-hunting",
    language: "en", source_type: "film",
    author: "Matt Damon, Ben Affleck", title: "Good Will Hunting", year: 1997,
    emotions_tags: ["принятие", "исцеление", "вина", "освобождение"],
    text: "It's not your fault. It's not your fault. It's not your fault.",
  },

  // ===== Books =====
  {
    external_id: "en-tolkien-not-all-wander",
    language: "en", source_type: "book",
    author: "J. R. R. Tolkien", title: "The Fellowship of the Ring", year: 1954,
    emotions_tags: ["надежда", "свобода", "поиск", "вдохновение"],
    text: "All that is gold does not glitter,\nNot all those who wander are lost;\nThe old that is strong does not wither,\nDeep roots are not reached by the frost.\n\nFrom the ashes a fire shall be woken,\nA light from the shadows shall spring;\nRenewed shall be blade that was broken,\nThe crownless again shall be king.",
  },
  {
    external_id: "en-woolf-mrs-dalloway",
    language: "en", source_type: "book",
    author: "Virginia Woolf", title: "Mrs Dalloway", year: 1925,
    emotions_tags: ["одиночество", "присутствие", "красота", "тишина"],
    text: "She had the perpetual sense, as she watched the taxi cabs, of being out, out, far out to sea and alone; she always had the feeling that it was very, very dangerous to live even one day.",
  },
];