import type { SeedPiece } from "./seed-data.ts";

// Священное Писание — отрывки из Библии (Синодальный перевод RU, KJV/ESV-public EN, Восточноармянский HY).
// Подобраны по эмоциональной глубине: утешение, скорбь, надежда, любовь, страх, благодарность.
// Все тексты — общественное достояние.

const PASSAGES: Array<{
  ref: string;
  title: string;
  emotions: string[];
  ru: string;
  en: string;
  hy: string;
}> = [
  {
    ref: "ps-22",
    title: "Псалом 22 (23) — Господь Пастырь мой",
    emotions: ["утешение", "доверие", "покой", "защита", "тишина"],
    ru: "Господь — Пастырь мой; я ни в чём не буду нуждаться:\nОн покоит меня на злачных пажитях и водит меня к водам тихим,\nподкрепляет душу мою, направляет меня на стези правды ради имени Своего.\nЕсли я пойду и долиною смертной тени, не убоюсь зла, потому что Ты со мной;\nТвой жезл и Твой посох — они успокаивают меня.",
    en: "The Lord is my shepherd; I shall not want.\nHe maketh me to lie down in green pastures: he leadeth me beside the still waters.\nHe restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.\nYea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
    hy: "Տէրը իմ հովիւն է, ես կարօտ չեմ ըլլար.\nկանաչ արօտներու մէջ ինծի կը հանգչեցնէ, հանդարտ ջուրերու մօտ կ՚առաջնորդէ զիս։\nՀոգիս կը նորոգէ, արդարութեան շաւիղներով կը տանի զիս՝ իր անուան համար։\nԹէեւ մահուան շուքի ձորին մէջէն քալեմ, չարէն չեմ վախնար, որովհետեւ Դուն ինծի հետ ես։",
  },
  {
    ref: "mt-5-blessed",
    title: "Заповеди блаженства (Мф. 5:3–9)",
    emotions: ["надежда", "смирение", "утешение", "благодать", "мир"],
    ru: "Блаженны нищие духом, ибо их есть Царство Небесное.\nБлаженны плачущие, ибо они утешатся.\nБлаженны кроткие, ибо они наследуют землю.\nБлаженны алчущие и жаждущие правды, ибо они насытятся.\nБлаженны милостивые, ибо они помилованы будут.\nБлаженны чистые сердцем, ибо они Бога узрят.\nБлаженны миротворцы, ибо они будут наречены сынами Божиими.",
    en: "Blessed are the poor in spirit: for theirs is the kingdom of heaven.\nBlessed are they that mourn: for they shall be comforted.\nBlessed are the meek: for they shall inherit the earth.\nBlessed are they which do hunger and thirst after righteousness: for they shall be filled.\nBlessed are the merciful: for they shall obtain mercy.\nBlessed are the pure in heart: for they shall see God.\nBlessed are the peacemakers: for they shall be called the children of God.",
    hy: "Երանի՜ հոգիով աղքատներուն, որովհետեւ անոնցն է երկինքի թագաւորութիւնը։\nԵրանի՜ սգաւորներուն, որովհետեւ անոնք պիտի մխիթարուին։\nԵրանի՜ հեզերուն, որովհետեւ անոնք երկիրը պիտի ժառանգեն։\nԵրանի՜ ողորմածներուն, որովհետեւ անոնք ողորմութիւն պիտի գտնեն։\nԵրանի՜ սիրտով մաքուրներուն, որովհետեւ անոնք Աստուած պիտի տեսնեն։",
  },
  {
    ref: "1cor-13",
    title: "Гимн любви (1 Кор. 13:4–8)",
    emotions: ["любовь", "терпение", "нежность", "вера", "вечность"],
    ru: "Любовь долготерпит, милосердствует, любовь не завидует,\nлюбовь не превозносится, не гордится, не бесчинствует, не ищет своего,\nне раздражается, не мыслит зла, не радуется неправде, а сорадуется истине;\nвсё покрывает, всему верит, всего надеется, всё переносит.\nЛюбовь никогда не перестаёт.",
    en: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.\nIt is not rude, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.\nLove does not delight in evil but rejoices with the truth.\nIt always protects, always trusts, always hopes, always perseveres.\nLove never fails.",
    hy: "Սէրը համբերատար է, քաղցր է. սէրը չի նախանձիր, չի պարծենար, չի հպարտանար,\nանվայել բան չի ըներ, իր շահը չի փնտռեր, չի գրգռուիր, չարիք չի մտածեր,\nանիրաւութեան վրայ չ՚ուրախանար, այլ ճշմարտութեան հետ կ՚ուրախանայ.\nամէն բան կը ծածկէ, ամէն բանի կը հաւատայ, ամէն բան կը յուսայ, ամէն բան կը տանի։\nՍէրը երբեք չ՚իյնար։",
  },
  {
    ref: "mt-11-28",
    title: "Придите ко Мне (Мф. 11:28–30)",
    emotions: ["усталость", "утешение", "покой", "доверие", "облегчение"],
    ru: "Придите ко Мне, все труждающиеся и обременённые, и Я успокою вас;\nвозьмите иго Моё на себя и научитесь от Меня, ибо Я кроток и смирен сердцем,\nи найдёте покой душам вашим;\nибо иго Моё благо, и бремя Моё легко.",
    en: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.\nTake my yoke upon you, and learn of me; for I am meek and lowly in heart:\nand ye shall find rest unto your souls.\nFor my yoke is easy, and my burden is light.",
    hy: "Եկէ՛ք ինծի, բոլոր յոգնածներդ ու բեռնաւորուածներդ, եւ ես ձեզի հանգիստ պիտի տամ։\nԱռէ՛ք իմ լուծս ձեր վրայ ու սորվեցէ՛ք ինձմէ, որովհետեւ հեզ եմ ու սրտով խոնարհ.\nեւ ձեր հոգիներուն հանգիստ պիտի գտնէք։",
  },
  {
    ref: "ecc-3",
    title: "Время всему (Еккл. 3:1–8)",
    emotions: ["принятие", "смирение", "тишина", "мудрость", "перемены"],
    ru: "Всему своё время, и время всякой вещи под небом:\nвремя рождаться, и время умирать; время насаждать, и время вырывать посаженное;\nвремя плакать, и время смеяться; время сетовать, и время плясать;\nвремя молчать, и время говорить; время любить, и время ненавидеть;\nвремя войне, и время миру.",
    en: "To every thing there is a season, and a time to every purpose under the heaven:\nA time to be born, and a time to die; a time to plant, and a time to pluck up that which is planted;\nA time to weep, and a time to laugh; a time to mourn, and a time to dance;\nA time to keep silence, and a time to speak;\nA time to love, and a time to hate; a time of war, and a time of peace.",
    hy: "Ամէն բան ունի իր ժամանակը, եւ երկնքի տակ ամէն գործի համար ատեն կայ.\nծնելու ժամանակ կայ ու մեռնելու ժամանակ. տնկելու ժամանակ ու տնկածը խլելու ժամանակ.\nլալու ժամանակ ու խնդալու ժամանակ. սգալու ժամանակ ու պարելու ժամանակ.\nլռելու ժամանակ ու խօսելու ժամանակ. սիրելու ժամանակ ու ատելու ժամանակ։",
  },
  {
    ref: "ps-50",
    title: "Псалом 50 (51) — Помилуй меня, Боже",
    emotions: ["покаяние", "скорбь", "надежда", "обновление", "молитва"],
    ru: "Помилуй меня, Боже, по великой милости Твоей,\nи по множеству щедрот Твоих изгладь беззакония мои.\nМногократно омой меня от беззакония моего, и от греха моего очисти меня.\nСердце чистое сотвори во мне, Боже, и дух правый обнови внутри меня.\nНе отвергни меня от лица Твоего и Духа Твоего Святаго не отними от меня.",
    en: "Have mercy upon me, O God, according to thy lovingkindness:\naccording unto the multitude of thy tender mercies blot out my transgressions.\nWash me thoroughly from mine iniquity, and cleanse me from my sin.\nCreate in me a clean heart, O God; and renew a right spirit within me.\nCast me not away from thy presence; and take not thy holy spirit from me.",
    hy: "Ողորմէ՜ ինծի, ո՛վ Աստուած, քու մեծ ողորմութեանդ համեմատ.\nքու գթութեանց բազմութեան համեմատ ջնջէ՛ իմ յանցանքներս։\nՈղողէ՛ զիս իմ անօրէնութենէս ու մաքրէ՛ զիս իմ մեղքէս։\nՄաքուր սի՛րտ ստեղծէ իմ մէջս, ո՛վ Աստուած, ու իմ ներսիդիս նոր ու հաստատուն հոգի՛ նորոգէ։",
  },
  {
    ref: "is-40-31",
    title: "Надеющиеся на Господа (Ис. 40:29–31)",
    emotions: ["надежда", "сила", "усталость", "вдохновение", "обновление"],
    ru: "Он даёт утомлённому силу, и изнемогшему дарует крепость.\nУтомляются и юноши и ослабевают, и молодые люди падают,\nа надеющиеся на Господа обновятся в силе:\nподнимут крылья, как орлы, потекут — и не устанут, пойдут — и не утомятся.",
    en: "He giveth power to the faint; and to them that have no might he increaseth strength.\nEven the youths shall faint and be weary, and the young men shall utterly fall:\nBut they that wait upon the Lord shall renew their strength;\nthey shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    hy: "Ան յոգնածին ոյժ կու տայ, ու անզօրին զօրութիւնը կը շատցնէ։\nՊատանիներն ու երիտասարդները կը յոգնին ու կ՚իյնան,\nբայց Տէրոջը յուսացողները նոր ոյժ պիտի առնեն.\nարծիւներու պէս թեւերով պիտի բարձրանան, պիտի վազեն ու չպիտի յոգնին։",
  },
  {
    ref: "ps-138",
    title: "Псалом 138 (139) — Ты испытал меня",
    emotions: ["близость", "тайна", "молитва", "присутствие", "доверие"],
    ru: "Господи! Ты испытал меня и знаешь.\nТы знаешь, когда я сажусь и когда встаю; Ты разумеешь помышления мои издали.\nИду ли я, отдыхаю ли — Ты окружаешь меня, и все пути мои известны Тебе.\nКуда пойду от Духа Твоего, и от лица Твоего куда убегу?\nВзойду ли на небо — Ты там; сойду ли в преисподнюю — и там Ты.",
    en: "O Lord, thou hast searched me, and known me.\nThou knowest my downsitting and mine uprising, thou understandest my thought afar off.\nThou compassest my path and my lying down, and art acquainted with all my ways.\nWhither shall I go from thy spirit? or whither shall I flee from thy presence?\nIf I ascend up into heaven, thou art there: if I make my bed in hell, behold, thou art there.",
    hy: "Ո՛վ Տէր, զիս քննեցիր ու ճանչցար։\nԴուն գիտես իմ նստիլս ու ելլելս, հեռուէն կը հասկնաս իմ խորհուրդս։\nԴուն շուրջս ես իմ քալելուս ու պառկելուս ատեն, ու բոլոր ճամբաներս կը ճանչնաս։\nՈւր երթամ քու Հոգիէդ, ու քու երեսէդ ո՞ւր փախչիմ։",
  },
  {
    ref: "rom-8-38",
    title: "Ничто не отлучит от любви (Рим. 8:38–39)",
    emotions: ["любовь", "вера", "надежда", "утешение", "страх"],
    ru: "Ибо я уверен, что ни смерть, ни жизнь, ни Ангелы, ни Начала, ни Силы,\nни настоящее, ни будущее, ни высота, ни глубина, ни другая какая тварь\nне может отлучить нас от любви Божией во Христе Иисусе, Господе нашем.",
    en: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers,\nnor things present, nor things to come, nor height, nor depth, nor any other creature,\nshall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
    hy: "Որովհետեւ համոզուած եմ թէ ո՛չ մահը, ո՛չ կեանքը, ո՛չ հրեշտակները, ո՛չ իշխանութիւնները,\nո՛չ ներկայ բաները, ո՛չ գալիքները, ո՛չ բարձրութիւնը, ո՛չ խորութիւնը,\nեւ ո՛չ ալ ուրիշ որեւէ արարած պիտի կարենայ մեզ բաժնել Աստուծոյ սէրէն, որ մեր Տիրոջ Քրիստոս Յիսուսի մէջ է։",
  },
  {
    ref: "ps-129",
    title: "Псалом 129 (130) — Из глубины",
    emotions: ["скорбь", "молитва", "ожидание", "надежда", "одиночество"],
    ru: "Из глубины взываю к Тебе, Господи. Господи! услышь голос мой.\nДа будут уши Твои внимательны к голосу молений моих.\nЕсли Ты, Господи, будешь замечать беззакония, — Господи! кто устоит?\nНо у Тебя прощение, да благоговеют пред Тобою.\nНадеется душа моя на Господа более, нежели стражи — на утро.",
    en: "Out of the depths have I cried unto thee, O Lord. Lord, hear my voice:\nlet thine ears be attentive to the voice of my supplications.\nIf thou, Lord, shouldest mark iniquities, O Lord, who shall stand?\nBut there is forgiveness with thee, that thou mayest be feared.\nMy soul waiteth for the Lord more than they that watch for the morning.",
    hy: "Խորունկներէն քեզի կանչեցի, ո՛վ Տէր։ Ո՛վ Տէր, լսէ՛ իմ ձայնս.\nքու ականջներդ թող ուշադիր ըլլան իմ աղաչանքիս ձայնին։\nԵթէ Դուն, ո՛վ Տէր, անօրէնութիւնները նկատի առնէիր, ո՛վ Տէր, ո՞վ պիտի կանգնէր։\nԲայց քու քովդ թողութիւն կայ։\nԻմ հոգիս Տէրը կը սպասէ, պահապաններէն աւելի՝ որոնք առաւօտին կը սպասեն։",
  },
  {
    ref: "lam-3",
    title: "Плач Иеремии 3:22–26",
    emotions: ["скорбь", "надежда", "верность", "утро", "ожидание"],
    ru: "По милости Господа мы не исчезли, ибо милосердие Его не истощилось.\nОно обновляется каждое утро; велика верность Твоя!\nГосподь — часть моя, говорит душа моя, — итак буду надеяться на Него.\nБлаг Господь к надеющимся на Него, к душе, ищущей Его.\nБлаго тому, кто терпеливо ожидает спасения от Господа.",
    en: "It is of the Lord's mercies that we are not consumed, because his compassions fail not.\nThey are new every morning: great is thy faithfulness.\nThe Lord is my portion, saith my soul; therefore will I hope in him.\nThe Lord is good unto them that wait for him, to the soul that seeketh him.\nIt is good that a man should both hope and quietly wait for the salvation of the Lord.",
    hy: "Տէրոջը ողորմութիւններն են, որ չհատանք, քանզի անոր գթութիւնները չեն պակսիր.\nամէն առաւօտ նոր են։ Մեծ է քու հաւատարմութիւնդ։\nՏէրը իմ բաժինս է, կ՚ըսէ իմ հոգիս. ուստի անոր պիտի յուսամ։\nԲարի է Տէրը անոնց, որ իրեն կը սպասեն, անոր հոգիին՝ որ զինքը կը փնտռէ։",
  },
  {
    ref: "phil-4",
    title: "Радуйтесь всегда (Флп. 4:6–7)",
    emotions: ["тревога", "мир", "благодарность", "молитва", "радость"],
    ru: "Не заботьтесь ни о чём, но всегда в молитве и прошении\nс благодарением открывайте свои желания пред Богом, —\nи мир Божий, который превыше всякого ума,\nсоблюдёт сердца ваши и помышления ваши во Христе Иисусе.",
    en: "Be careful for nothing; but in every thing by prayer and supplication\nwith thanksgiving let your requests be made known unto God.\nAnd the peace of God, which passeth all understanding,\nshall keep your hearts and minds through Christ Jesus.",
    hy: "Ոչինչի համար մի՛ մտահոգուիք, հապա ամէն բանի մէջ աղօթքով ու աղաչանքով,\nգոհաբանութեամբ ձեր խնդրուածքը Աստուծոյ թող յայտնի ըլլայ.\nեւ Աստուծոյ խաղաղութիւնը, որ ամէն մտքէ վեր է,\nպիտի պահէ ձեր սիրտերն ու ձեր մտածումները Քրիստոս Յիսուսով։",
  },
  {
    ref: "jn-14",
    title: "Да не смущается сердце ваше (Ин. 14:1, 27)",
    emotions: ["страх", "утешение", "мир", "вера", "надежда"],
    ru: "Да не смущается сердце ваше; веруйте в Бога, и в Меня веруйте.\nМир оставляю вам, мир Мой даю вам;\nне так, как мир даёт, Я даю вам.\nДа не смущается сердце ваше и да не устрашается.",
    en: "Let not your heart be troubled: ye believe in God, believe also in me.\nPeace I leave with you, my peace I give unto you:\nnot as the world giveth, give I unto you.\nLet not your heart be troubled, neither let it be afraid.",
    hy: "Ձեր սիրտը թող չվրդովուի. Աստուծոյ հաւատացէք, ինծի ալ հաւատացէք։\nԽաղաղութիւն կը թողում ձեզի, իմ խաղաղութիւնս կու տամ ձեզի.\nաշխարհի տուածին պէս չէ, որ ես կու տամ ձեզի։\nՁեր սիրտը թող չվրդովուի ու չվախնայ։",
  },
  {
    ref: "song-2",
    title: "Песнь Песней 2:10–13",
    emotions: ["любовь", "нежность", "весна", "радость", "обновление"],
    ru: "Возлюбленный мой начал говорить мне: встань, возлюбленная моя, прекрасная моя, выйди!\nВот, зима уже прошла; дождь миновал, перестал;\nцветы показались на земле; время пения настало,\nи голос горлицы слышен в стране нашей;\nсмоковницы распустили свои почки, и виноградные лозы, расцветая, издают благовоние.",
    en: "My beloved spake, and said unto me, Rise up, my love, my fair one, and come away.\nFor, lo, the winter is past, the rain is over and gone;\nThe flowers appear on the earth; the time of the singing of birds is come,\nand the voice of the turtle is heard in our land;\nThe fig tree putteth forth her green figs, and the vines with the tender grape give a good smell.",
    hy: "Իմ սիրականս ինծի խօսեցաւ ու ըսաւ. «Ելի՛ր, իմ սէրս, իմ գեղեցիկս, եւ եկուր.\nքանզի ահա ձմեռը անցաւ, անձրեւը դադարեցաւ։\nԾաղիկները երկրի վրայ երեւցան, երգելու ատենը հասաւ,\nեւ տատրակին ձայնը մեր երկրին մէջ կը լսուի։»",
  },
  {
    ref: "gen-1",
    title: "В начале (Быт. 1:1–5)",
    emotions: ["тишина", "начало", "свет", "тайна", "благоговение"],
    ru: "В начале сотворил Бог небо и землю.\nЗемля же была безвидна и пуста, и тьма над бездною, и Дух Божий носился над водою.\nИ сказал Бог: да будет свет. И стал свет.\nИ увидел Бог свет, что он хорош, и отделил Бог свет от тьмы.\nИ был вечер, и было утро: день один.",
    en: "In the beginning God created the heaven and the earth.\nAnd the earth was without form, and void; and darkness was upon the face of the deep.\nAnd the Spirit of God moved upon the face of the waters.\nAnd God said, Let there be light: and there was light.\nAnd God saw the light, that it was good: and God divided the light from the darkness.",
    hy: "Սկիզբը Աստուած ստեղծեց երկինքն ու երկիրը։\nԵրկիրը անձեւ ու պարապ էր, ու անդունդին երեսին վրայ խաւար կար,\nեւ Աստուծոյ Հոգին ջուրերուն վրայ կը շարժէր։\nԱստուած ըսաւ. «Լոյս ըլլայ»։ Ու լոյս եղաւ։\nԱստուած տեսաւ թէ լոյսը բարի էր, ու Աստուած լոյսը խաւարէն զատեց։",
  },
];

export const SEED_BIBLE: SeedPiece[] = PASSAGES.flatMap(p => [
  {
    external_id: `bible-ru-${p.ref}`,
    language: "ru",
    source_type: "book",
    author: "Библия (Синодальный перевод)",
    title: p.title,
    emotions_tags: p.emotions,
    text: p.ru,
  },
  {
    external_id: `bible-en-${p.ref}`,
    language: "en",
    source_type: "book",
    author: "The Holy Bible (KJV)",
    title: p.title,
    emotions_tags: p.emotions,
    text: p.en,
  },
  {
    external_id: `bible-hy-${p.ref}`,
    language: "hy",
    source_type: "book",
    author: "Սուրբ Գիրք (Աստուածաշունչ)",
    title: p.title,
    emotions_tags: p.emotions,
    text: p.hy,
  },
]);
