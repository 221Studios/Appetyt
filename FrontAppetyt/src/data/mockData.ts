import { Recipe, Chef, ShoppingItem } from '../types';

export const CHEFS_DATA: Chef[] = [
  {
    id: 'foxx',
    name: 'Foxx Gotuje',
    slug: 'foxx-gotuje',
    shortName: 'Foxx Gotuje',
    recipesCount: 48,
    sourceDomain: 'youtube.com/@FoxxGotuje',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq2SXcsB5uafFF63ImuatUrgPAD_UV_KAAt9ixgvkLFgbfG8O48pwp62j6XM0lhG3WaKyA1QeGJPHsafUvaPxKiyAxPyahMb9S07kC-Xail1TbY3XVGpIwzMnVkyhO0tq1jNew97b868xNlXnlGjzxWTA4rjn3B9wsLqVML6ntthz4ZoVjWL7BoKauoasodo7BJbHmrvsuW86TEvaBNvjnvftF1yC0sFQpdPXTqzPD99Bys6Fg2U-_',
    isVerified: true,
    isFollowing: false
  },
  {
    id: 'jakubiak',
    name: 'Tomasz Jakubiak',
    slug: 'tomasz-jakubiak',
    shortName: 'T. Jakubiak',
    recipesCount: 32,
    sourceDomain: 'tomaszjakubiak.pl',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAb4p5jC6f9Ub12hZ_chLV_G5Cn_5oez_iF8lO1AcfyCbRy5FmmP0fr1BtHB4e3-l33ZWjCOK-kAajiZmrt2Ml4LDBalZpwA3z3efkQZuUz-XYdvfTF7urxbb9mrn3gc_xNc5_11I6DStTMTdOpIDf4TT6a9oLzBlByxZMNq_s_btqqiiuuRMKC3t_hOksDN3RHGNwqoohc-Yol6OzHU3cCkb5yLU2PN-VXb5GL62uEWVLzcqP9F8Ua',
    isVerified: true,
    isFollowing: false
  },
  {
    id: 'fogel',
    name: 'Paulina Fogel',
    slug: 'paulina-fogel',
    shortName: 'P. Fogel',
    recipesCount: 19,
    sourceDomain: 'instagram.com/paulinafogel',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHUX-Yw9sK2kmNsxi8xuSqu9GR9IY-g5cGrMytCs3eyS8YANbQ-PRGaRvOuxlmgOj7Q9ro40RqYvL45a6Ta1XoOYonkzn_AC7_CHI4IalwPVKoF5urF3LPqpX7FU4YQ5eGeYQM0EaYJvH3-qehAIcYedrMWqIyWoK6GKUkJHjnYrfMLU1bYjteKbCTTQNps40kMDZCJnbNASg59VrgSq7dbAd2kw8gmt-xjpOuK6WVTU9HCShe-VDo',
    isVerified: true,
    isFollowing: false
  },
  {
    id: 'maklowicz',
    name: 'Robert Makłowicz',
    slug: 'robert-maklowicz',
    shortName: 'R. Makłowicz',
    recipesCount: 64,
    sourceDomain: 'maklowicz.pl',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNqmFW1sDL2IzHOAvT2fmch0fA47EN0duliUbaj8Mdw-G7QV4zX1BWakYKIEjhu94LVmUv4j7OniRzlfbaQpDMUB6LbrDJJg4AwxGBk6yCsUuQw0ExdCJBVjMuzg-YHKoAi3rf5yXDQuFF2caZgcSxFV37hHR664WE5LXZZug_--WQC3vPCnvmSyxBy7yI7mc0j3qEcEAlqasvWEtPH_Zdpk_lV2aXXp8eEV8ea3uOav6_nLdWJZlI',
    isVerified: true,
    isFollowing: false
  }
];

export const RECIPES_DATA: Recipe[] = [
  {
    id: 'pappardelle-borowiki',
    title: 'Kremowe Pappardelle z Borowikami i Świeżym Tymiankiem',
    subtitle: 'Autorska Gastronomia',
    categoryLabel: 'Autorska Gastronomia',
    author: 'Tomasz Jakubiak',
    authorAvatar: 'TJ',
    authorSourceUrl: 'https://tomaszjakubiak.pl',
    authorSlug: 'jakubiak',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt1SZgwssb9qGBa-X4PyMJc913qigXzytIOdDv9jOB08h4Nl_I6KCkA-KRC-_6qG73U8nSjhNIcQQJ9XwvlWfkUQy6wNmB0fZQ_J9W7UUMBpg3N_Cw6URJ_M65pgkBvvatcnDf9gCiQ-R9-M99IJTm0Z488MuUz4axcE_sOlMq1S9mLBXvI-DOfuDYCcxw0bWCreDyuLjydCEZK9lg_kPObdUysc_Mns6vfO809pwhahYhscnu6vmi',
    imageAlt: 'Rich golden pappardelle pasta intertwined with sauteed porcini mushrooms, fresh green thyme sprigs, parmigiano shavings, in a rustic ceramic deep plate under warm intimate kitchen dining lighting',
    durationMinutes: 25,
    estimatedPrice: 'ok. 28 zł',
    numericPrice: 28.40,
    caloriesText: 'brak w źródle',
    category: 'Makarony & Risotto',
    cuisine: 'Włoska',
    verified: true,
    baseServings: 2,
    ingredients: [
      {
        id: 'ing-1',
        name: 'makaronu pappardelle',
        categoryDetail: 'Semolina di grano duro',
        amountBase: 250,
        unit: 'g makaronu pappardelle',
        inFridge: true,
        scalable: true,
        icon: 'grain',
        estimatedPrice: 8.99,
        store: 'Biedronka'
      },
      {
        id: 'ing-2',
        name: 'świeżych borowików (lub mrożonych)',
        categoryDetail: 'Główny składnik runa leśnego',
        amountBase: 300,
        unit: 'g świeżych borowików (lub mrożonych)',
        inFridge: false,
        scalable: true,
        icon: 'nature',
        estimatedPrice: 19.99,
        store: 'Carrefour'
      },
      {
        id: 'ing-3',
        name: 'ząbki czosnku, drobno posiekane',
        categoryDetail: 'Baza aromatyczna',
        amountBase: 2,
        unit: 'ząbki czosnku, drobno posiekane',
        inFridge: true,
        scalable: true,
        icon: 'restaurant_menu'
      },
      {
        id: 'ing-4',
        name: 'śmietanki 30%',
        categoryDetail: 'Słodka kremówka',
        amountBase: 150,
        unit: 'ml śmietanki 30%',
        inFridge: true,
        scalable: true,
        icon: 'water_drop',
        estimatedPrice: 3.69,
        store: 'Lidl'
      },
      {
        id: 'ing-5',
        name: 'gałązki świeżego tymianku',
        categoryDetail: 'Świeże zioła',
        amountBase: 2,
        unit: 'gałązki świeżego tymianku',
        inFridge: false,
        scalable: true,
        icon: 'spa',
        estimatedPrice: 4.49,
        store: 'Biedronka'
      },
      {
        id: 'ing-6',
        name: 'masła klarowanego',
        categoryDetail: 'Do podsmażenia grzybów',
        amountBase: 30,
        unit: 'g masła klarowanego',
        inFridge: true,
        scalable: true,
        icon: 'lunch_dining'
      },
      {
        id: 'ing-7',
        name: 'Sól morska i świeżo mielony pieprz',
        categoryDetail: 'Do smaku',
        amountBase: 1,
        unit: 'do smaku',
        inFridge: true,
        inPantry: true,
        scalable: false,
        icon: 'scatter_plot'
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Oczyszczenie i pokrojenie borowików',
        description: 'Borowiki dokładnie oczyść pędzelkiem lub zwilżonym ręcznikiem papierowym. Pokrój w grubsze plastry, by zachowały mięsistą strukturę.',
        durationMinutes: 4,
        stepIngredients: [
          { name: 'Świeże borowiki', amountBase: 300, unit: 'g', scalable: true, icon: 'nature' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Złocenie na maśle klarowanym',
        description: 'Rozgrzej mocno masło klarowane na szerokiej patelni. Wrzucaj borowiki partiami, by ich nie dusić. Smaż do uzyskania głębokiego, orzechowego koloru (ok. 5 minut).',
        durationMinutes: 5,
        stepIngredients: [
          { name: 'Masło klarowane', amountBase: 30, unit: 'g', scalable: true, icon: 'lunch_dining' },
          { name: 'Pokrojone borowiki', amount: 'z kroku 1', icon: 'nature' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Aromatyzacja czosnkiem i tymiankiem',
        description: 'Zmniejsz ogień, dodaj drobno posiekany czosnek i listki świeżego tymianku. Smaż przez 60 sekund, aż zapach ziół wypełni kuchnię.',
        durationMinutes: 2,
        stepIngredients: [
          { name: 'Czosnek', amountBase: 2, unit: 'ząbki', scalable: true, icon: 'restaurant_menu' },
          { name: 'Świeży tymianek', amountBase: 2, unit: 'gałązki', scalable: true, icon: 'spa' }
        ]
      },
      {
        stepNumber: 4,
        title: 'Gotowanie al dente',
        description: 'W dużym garnku z dobrze osoloną wodą ugotuj pappardelle 1 minutę krócej niż sugeruje opakowanie. Zachowaj 1/2 szklanki skrobiowej wody z makaronu.',
        durationMinutes: 7,
        stepIngredients: [
          { name: 'Makaron pappardelle', amountBase: 250, unit: 'g', scalable: true, icon: 'grain' },
          { name: 'Sól morska', amount: '1 łyżka do wody', icon: 'scatter_plot' }
        ]
      },
      {
        stepNumber: 5,
        title: 'Kremowa emulsja',
        description: 'Na patelnię wlej śmietankę 30% i 3-4 łyżki wody z makaronu. Zredukuj sos na małym ogniu do aksamitnej konsystencji, doprawiając solą i pieprzem.',
        durationMinutes: 4,
        stepIngredients: [
          { name: 'Śmietanka 30%', amountBase: 150, unit: 'ml', scalable: true, icon: 'water_drop' },
          { name: 'Woda z makaronu', amount: '3-4 łyżki', icon: 'water_drop' },
          { name: 'Sól i pieprz', amount: 'do smaku', icon: 'scatter_plot' }
        ]
      },
      {
        stepNumber: 6,
        title: 'Finisz i serwowanie',
        description: 'Przełóż makaron bezpośrednio na patelnię, potrząśnij nią energicznie (mantecatura) do idealnego obleczenia wstążek sosem. Podawaj natychmiast na podgrzanych talerzach.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Ugotowane pappardelle', amount: 'z patelni', icon: 'dinner_dining' },
          { name: 'Świeży tymianek', amount: 'do dekoracji', icon: 'spa' }
        ]
      }
    ],
    costBreakdown: {
      totalEstimate: 'ok. 28,40 zł',
      catalogAvg: '32,10 zł',
      userWithCards: '28,40 zł',
      toBuyNow: '17,20 zł (borowiki, tymianek)',
      items: [
        { name: "Pappardelle all'uovo 500g", price: '8,99 zł' },
        { name: 'Borowiki mrożone kostka 300g', price: '13,99 zł', highlight: true },
        { name: 'Śmietanka 30% 200ml', price: '3,69 zł' },
        { name: 'Świeży tymianek doniczka', price: '4,99 zł', highlight: true }
      ]
    }
  },
  {
    id: 'smash-burger',
    title: 'Klasyczny Smash Burger z Karmelizowaną Cebulą',
    subtitle: 'Street Food Klasyk',
    categoryLabel: 'Street Food',
    author: 'Szef Foxx Gotuje',
    authorAvatar: 'FG',
    authorSourceUrl: 'https://youtube.com/@FoxxGotuje',
    authorSlug: 'foxx',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDohqjD4FgV4xrDc2-zjnDzfodbRt5QjrIq_fQLaH8WlwsYW6DDw6YVRqN-EaN7bCV82XwAq-_U6UL1MYmlM-qUI9G063HF5-dVdEYFCl-_orm7El5_oBABUh5POedRwQROlGbhKdd5hbGfZsetQhvb8WEGR0i_LVJQgA8AnZmRZPsmMsdVQO1Fvm0EMWzlS1-dZ6b5vBQvSSiwMTsHSB7Uy-ELIIjDfVUy58VRekjjKsdjD5AxvLNz',
    imageAlt: 'Classic American smash burger with crispy lace edges, melted yellow cheddar cheese oozing, brown sweet caramelized onions, on toasted brioche bun',
    durationMinutes: 20,
    estimatedPrice: 'ok. 22 zł',
    numericPrice: 22.00,
    caloriesText: '620 kcal',
    category: 'Street Food & Burgery',
    cuisine: 'Amerykańska',
    verified: true,
    baseServings: 2,
    ingredients: [
      { id: 'sb-1', name: 'wołowiny mielonej 20% tłuszczu', categoryDetail: 'Antrykot lub łopatka', amountBase: 320, unit: 'g wołowiny mielonej', inFridge: true, scalable: true, icon: 'lunch_dining' },
      { id: 'sb-2', name: 'bułki maślane brioche', categoryDetail: 'Pieczywo tostowane', amountBase: 2, unit: 'szt. bułek brioche', inFridge: true, scalable: true, icon: 'bakery_dining' },
      { id: 'sb-3', name: 'plastrów sera cheddar', categoryDetail: 'Prawdziwy cheddar topiony', amountBase: 4, unit: 'plastry sera cheddar', inFridge: true, scalable: true, icon: 'cheese' },
      { id: 'sb-4', name: 'cebuli cukrowej', categoryDetail: 'Karmelizowana na maśle', amountBase: 2, unit: 'szt. cebuli', inFridge: true, scalable: true, icon: 'nutrition' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Karmelizacja cebuli',
        description: 'Cebulę pokrój w piórka i smaż wolno na maśle ze szczyptą soli przez 10 minut do uzyskania bursztynowego koloru.',
        durationMinutes: 10,
        stepIngredients: [
          { name: 'Cebula cukrowa', amountBase: 2, unit: 'szt.', scalable: true, icon: 'nutrition' },
          { name: 'Masło i sól', amount: '1 łyżeczka', icon: 'lunch_dining' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Formowanie kul mięsa',
        description: 'Podziel mielone na równe kule po 80g, nie wyrabiaj ich zbyt mocno, aby zachować luźną strukturę.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Wołowina mielona 20%', amountBase: 320, unit: 'g', scalable: true, icon: 'lunch_dining' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Mocne smażenie (smash)',
        description: 'Rozgrzej żeliwną płytę, dociśnij kulki praską na 10 sekund tworząc chrupiącą koronkę. Smaż 2 minuty i obróć.',
        durationMinutes: 4,
        stepIngredients: [
          { name: 'Uformowane kule wołowe', amount: 'z kroku 2', icon: 'lunch_dining' },
          { name: 'Sól i pieprz', amount: 'do oprószenia', icon: 'scatter_plot' }
        ]
      },
      {
        stepNumber: 4,
        title: 'Topienie sera i składanie',
        description: 'Połóż cheddar na kotletach, nakryj pokrywką na 30 sekund, złóż bułki z sosem i cebulką.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Ser cheddar', amountBase: 4, unit: 'plastry', scalable: true, icon: 'cheese' },
          { name: 'Bułki brioche', amountBase: 2, unit: 'szt.', scalable: true, icon: 'bakery_dining' },
          { name: 'Karmelizowana cebula', amount: 'z kroku 1', icon: 'nutrition' }
        ]
      }
    ]
  },
  {
    id: 'pad-thai',
    title: 'Autentyczny Pad Thai z Krewetkami i Tamaryndowcem',
    subtitle: 'Kuchnia azjatycka',
    categoryLabel: 'Azjatycka',
    author: 'Szefowa Paulina Fogel',
    authorAvatar: 'PF',
    authorSourceUrl: 'https://instagram.com/paulinafogel',
    authorSlug: 'fogel',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFwbj5viHztYZYwa8tqym2Lfuc40Paki4HUq9sRPW7p7jqLc9kKiuAr-nJxKyla9H80k74eT3lTmQOvDJm2GECWsMgpuLKV9uqF5dGBQG3wJ49S98u9tGucwsLPktImPqGtAys0xXFIgqOKZkWoPYZhPqMZrQG472gAJFxdXe-LHImlIo_c8922wmrgQx29wMiP_Tcw2SuXUX5ZE5N12pjYVYfZtixhLsQmag0kY0vUgmt8RAfptC8',
    imageAlt: 'Traditional Thai Pad Thai stir-fried noodles with plump pink prawns, crushed roasted peanuts, fresh bean sprouts, lime wedge',
    durationMinutes: 30,
    estimatedPrice: 'ok. 34 zł',
    numericPrice: 34.00,
    caloriesText: 'brak w źródle',
    category: 'Makarony & Risotto',
    cuisine: 'Azjatycka',
    verified: true,
    baseServings: 2,
    ingredients: [
      { id: 'pt-1', name: 'makaronu ryżowego 5mm', categoryDetail: 'Wstążki ryżowe', amountBase: 150, unit: 'g makaronu ryżowego', inFridge: true, scalable: true, icon: 'ramen_dining' },
      { id: 'pt-2', name: 'krewetek tygrysich oczyszczonych', categoryDetail: 'Owoce morza', amountBase: 200, unit: 'g krewetek tygrysich', inFridge: false, scalable: true, icon: 'set_meal' },
      { id: 'pt-3', name: 'pasty tamaryndowej', categoryDetail: 'Kwasowa baza sosu', amountBase: 2, unit: 'łyżki pasty tamaryndowej', inFridge: true, scalable: true, icon: 'liquor' },
      { id: 'pt-4', name: 'orzeszków ziemnych prażonych', categoryDetail: 'Posypka chrupiąca', amountBase: 40, unit: 'g orzeszków', inFridge: true, scalable: true, icon: 'grain' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Namaczanie makaronu',
        description: 'Zalej makaron ciepłą wodą na 20 minut, aż stanie się elastyczny lecz wciąż twardy w środku.',
        durationMinutes: 20,
        stepIngredients: [
          { name: 'Makaron ryżowy 5mm', amountBase: 150, unit: 'g', scalable: true, icon: 'ramen_dining' },
          { name: 'Ciepła woda', amount: 'do namoczenia', icon: 'water_drop' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Wok i krewetki',
        description: 'Na mocno rozgrzanym woku przesmaż krewetki z czosnkiem i tofu przez 2 minuty.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Krewetki tygrysie', amountBase: 200, unit: 'g', scalable: true, icon: 'set_meal' },
          { name: 'Olej do woka', amount: '1 łyżka', icon: 'water_drop' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Sos i jajko',
        description: 'Zsuń składniki na bok woka, wbij jajko, wymieszaj i wlej przygotowany sos tamaryndowy z cukrem palmowym.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Pasta tamaryndowa', amountBase: 2, unit: 'łyżki', scalable: true, icon: 'liquor' },
          { name: 'Jajko wiejskie', amount: '1 szt.', icon: 'egg' }
        ]
      },
      {
        stepNumber: 4,
        title: 'Finisz ze szczypiorkiem',
        description: 'Dodaj kiełki fasoli mung, szczypiorek chiński i orzeszki. Wymieszaj i podawaj z limonką.',
        durationMinutes: 4,
        stepIngredients: [
          { name: 'Prażone orzeszki ziemne', amountBase: 40, unit: 'g', scalable: true, icon: 'grain' },
          { name: 'Kiełki i szczypiorek', amount: 'garść', icon: 'spa' },
          { name: 'Cząstki limonki', amount: 'do skropienia', icon: 'eco' }
        ]
      }
    ]
  },
  {
    id: 'losos-miso',
    title: 'Pieczony Łosoś Miso z Sezamową Fasolką',
    subtitle: 'Nowoczesna kuchnia rybna',
    categoryLabel: 'Ryby',
    author: 'Szef Michał Kuter',
    authorAvatar: 'MK',
    authorSourceUrl: 'https://kuter.pl',
    authorSlug: 'kuter',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDte5jc6mbF_SeI4ofZHs6kfmcg6NmqAye5MiYXvieqY9-IA7WHPi0dH7miTdlmroj2Aj3Fty0bxwBlalhgZCtt8TyljZvWNS-ldnDkvRraB0MSDBjj2FPChzkrpz2Ww1SmQ7wBmIlSp_CoMPyy2QgSJcOEblyoT_qHaaBQF1pPjankYc_m7H0o1pehvSeoWYgigsGuHOitN1o6VxNcU4FXbbRh3uCStW0EU9h5wY67dsH3hvMXgrpU',
    imageAlt: 'Glazed miso roasted salmon fillet with caramelized crust alongside vibrant green sesame green beans and scallions',
    durationMinutes: 25,
    estimatedPrice: 'ok. 42 zł',
    numericPrice: 42.00,
    caloriesText: '510 kcal',
    category: 'Szybkie obiady (<25 min)',
    cuisine: 'Azjatycka',
    verified: true,
    baseServings: 2,
    ingredients: [
      { id: 'lm-1', name: 'filetu z łososia ze skórą', categoryDetail: 'Świeża ryba premium', amountBase: 350, unit: 'g filetu z łososia', inFridge: true, scalable: true, icon: 'set_meal' },
      { id: 'lm-2', name: 'pasty miso shiro', categoryDetail: 'Biała pasta sojowa', amountBase: 2, unit: 'łyżki pasty miso', inFridge: true, scalable: true, icon: 'spa' },
      { id: 'lm-3', name: 'fasolki szparagowej zielonej', categoryDetail: 'Warzywa na parze', amountBase: 250, unit: 'g fasolki szparagowej', inFridge: true, scalable: true, icon: 'grass' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Glazura miso',
        description: 'Wymieszaj miso z mirinem, miodem i sosem sojowym na gładką emulsję.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Pasta miso shiro', amountBase: 2, unit: 'łyżki', scalable: true, icon: 'spa' },
          { name: 'Mirin / miód i sos sojowy', amount: 'po 1 łyżce', icon: 'liquor' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Marynowanie łososia',
        description: 'Posmaruj filety obficie glazurą i odstaw na 10 minut w temperaturze pokojowej.',
        durationMinutes: 10,
        stepIngredients: [
          { name: 'Filet z łososia ze skórą', amountBase: 350, unit: 'g', scalable: true, icon: 'set_meal' },
          { name: 'Glazura miso', amount: 'z kroku 1', icon: 'spa' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Pieczenie pod grillem',
        description: 'Piecz w 210°C przez 9 minut, aż wierzch się lekko skarmelizuje.',
        durationMinutes: 9,
        stepIngredients: [
          { name: 'Zamarynowany filet z łososia', amount: 'z kroku 2', icon: 'set_meal' },
          { name: 'Fasolka szparagowa zielona', amountBase: 250, unit: 'g', scalable: true, icon: 'grass' },
          { name: 'Prażony sezam', amount: '1 łyżeczka', icon: 'grain' }
        ]
      }
    ]
  },
  {
    id: 'rzymska-carbonara',
    title: 'Tradycyjna Rzymska Carbonara ze Spaghetti',
    subtitle: 'Włoska klasyka bez śmietanki',
    categoryLabel: 'Makarony & Risotto',
    author: 'Robert Makłowicz',
    authorAvatar: 'RM',
    authorSourceUrl: 'https://maklowicz.pl',
    authorSlug: 'maklowicz',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlT4FSWpkPFixhSxaCT1m3tcHLGTagFclegcnBEWdDnDCwq6w8e3ctAYpm5cOKGG2Vb4Cplv53BjXcE02U0yi2iA8UCTmf0AMeQNVVt_0df6BFt3wAM-hMeUmVghRrwNdycNkNRcWg0TRH1Bn1BiMdp0b3Fi0LGixs8kGS4yhTCV6ArS_B9x5XNWEWLv_8A-W38GkFTcQ7UKcN3jxP9CN7CM9WE2NficL_0OfOn-dUExVRpOVH7HRa',
    imageAlt: 'Authentic Italian creamy carbonara with crispy guanciale, pecorino romano and black pepper on twirled fork',
    durationMinutes: 15,
    estimatedPrice: 'ok. 18 zł',
    numericPrice: 18.00,
    caloriesText: '680 kcal',
    category: 'Makarony & Risotto',
    cuisine: 'Włoska',
    verified: true,
    baseServings: 2,
    ingredients: [
      { id: 'rc-1', name: 'makaronu spaghetti no. 5', categoryDetail: 'Makaron z pszenicy durum', amountBase: 200, unit: 'g makaronu spaghetti', inFridge: true, scalable: true, icon: 'grain' },
      { id: 'rc-2', name: 'guanciale lub boczku wędzonego', categoryDetail: 'Podgardle wieprzowe', amountBase: 120, unit: 'g boczku', inFridge: true, scalable: true, icon: 'lunch_dining' },
      { id: 'rc-3', name: 'żółtek jaj wiejskich', categoryDetail: 'Jajka od kur z wolnego wybiegu', amountBase: 3, unit: 'żółtka jaj', inFridge: true, scalable: true, icon: 'egg' },
      { id: 'rc-4', name: 'sera Pecorino Romano', categoryDetail: 'Owcza nuta rzymska', amountBase: 40, unit: 'g sera pecorino', inFridge: true, scalable: true, icon: 'cheese' },
      { id: 'rc-5', name: 'świeżo mielonego czarnego pieprzu', categoryDetail: 'Aromatyczny pieprz prażony', amountBase: 1, unit: 'łyżeczka pieprzu', inFridge: true, scalable: false, icon: 'scatter_plot' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Wytapianie boczku',
        description: 'Pokrój guanciale w słupki i wytapiaj na zimnej patelni na średnim ogniu do chrupkości.',
        durationMinutes: 5,
        stepIngredients: [
          { name: 'Guanciale lub boczek', amountBase: 120, unit: 'g', scalable: true, icon: 'lunch_dining' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Krem jajeczno-serowy',
        description: 'W misce roztrzep żółtka z drobno startym Pecorino i dużą ilością pieprzu na gęstą pastę.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Żółtka jaj wiejskich', amountBase: 3, unit: 'szt.', scalable: true, icon: 'egg' },
          { name: 'Ser Pecorino Romano', amountBase: 40, unit: 'g', scalable: true, icon: 'cheese' },
          { name: 'Świeżo mielony pieprz', amount: '1 łyżeczka', icon: 'scatter_plot' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Gotowanie makaronu',
        description: 'Ugotuj spaghetti al dente w lekko osolonej wodzie. Zachowaj chochlę wody.',
        durationMinutes: 7,
        stepIngredients: [
          { name: 'Makaron spaghetti no. 5', amountBase: 200, unit: 'g', scalable: true, icon: 'grain' },
          { name: 'Woda i sól', amount: 'do gotowania', icon: 'water_drop' }
        ]
      },
      {
        stepNumber: 4,
        title: 'Emulsja bez ścinania jajek',
        description: 'Zdejmij patelnię z ognia, wrzuć makaron, wlej krem jajeczny z wodą ze spaghetti i energicznie mieszaj do uzyskania aksamitnego kremu.',
        durationMinutes: 2,
        stepIngredients: [
          { name: 'Ugotowane spaghetti', amount: 'z garnka', icon: 'grain' },
          { name: 'Krem Pecorino z żółtkami', amount: 'z kroku 2', icon: 'egg' },
          { name: 'Woda ze spaghetti', amount: '2-3 łyżki', icon: 'water_drop' },
          { name: 'Chrupiące guanciale', amount: 'z kroku 1', icon: 'lunch_dining' }
        ]
      }
    ]
  },
  {
    id: 'szakszuka-feta',
    title: 'Szakszuka ze Szpinakiem i Fetą',
    subtitle: 'Aromatyczne śniadanie na ciepło',
    categoryLabel: 'Szybkie obiady (<25 min)',
    author: 'Paulina Fogel',
    authorAvatar: 'PF',
    authorSourceUrl: 'https://instagram.com/paulinafogel',
    authorSlug: 'fogel',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCd7Xk5ESGNT4GlBOFOQlGczGGA5rDMQ6H0M6tEVc4MQ7yv_h2feIoMbJYImE2C8VyDaaSpEO5SV7frpsKU7aF6jAQ_5dswjkHBPJNbCdaYok1xDMnTHXI9S8WjMz3yDwZooqyJAoR__dIQ75EFj_s3qqXDXqEnJirJKN_eLDHc7CRXs8uRBA6TJam9-4TRY-sF5gDX2zfgKaMhJ0_BLD-SFFiswlhIB5rF7i_YrAgQXJAJ_FN27H2Q',
    imageAlt: 'Classic French shakshuka in cast iron pan with runny poached eggs, spiced tomato bell pepper sauce, fresh parsley and rustic bread slices',
    durationMinutes: 20,
    estimatedPrice: 'ok. 14 zł',
    numericPrice: 14.00,
    caloriesText: '380 kcal',
    category: 'Szybkie obiady (<25 min)',
    cuisine: 'Śródziemnomorska',
    verified: true,
    baseServings: 2,
    ingredients: [
      { id: 'sz-1', name: 'pomidorów krojonych w puszce', categoryDetail: 'Pelati z sosem', amountBase: 400, unit: 'g pomidorów w puszce', inFridge: false, scalable: true, icon: 'soup_kitchen' },
      { id: 'sz-2', name: 'jajka wiejskie', categoryDetail: 'Jajka klasa M/L', amountBase: 3, unit: 'szt. jaj', inFridge: true, scalable: true, icon: 'egg' },
      { id: 'sz-3', name: 'sera feta oryginalnego', categoryDetail: 'Słona grecka feta', amountBase: 80, unit: 'g sera feta', inFridge: false, scalable: true, icon: 'cheese' },
      { id: 'sz-4', name: 'świeżego szpinaku baby', categoryDetail: 'Zielenina', amountBase: 70, unit: 'g szpinaku', inFridge: true, scalable: true, icon: 'spa' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Baza pomidorowa',
        description: 'Podduś czosnek i kmin rzymski na oliwie, dodaj pomidory i zredukuj sos przez 7 minut.',
        durationMinutes: 7,
        stepIngredients: [
          { name: 'Pomidory krojone w puszce', amountBase: 400, unit: 'g', scalable: true, icon: 'soup_kitchen' },
          { name: 'Czosnek i oliwa z oliwek', amount: '1 ząbek + 1 łyżka', icon: 'restaurant_menu' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Szpinak i zagłębienia',
        description: 'Wymieszaj liście szpinaku aż zwiędną, zrób 3 wgłębienia łyżką w sosie.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Świeży szpinak baby', amountBase: 70, unit: 'g', scalable: true, icon: 'spa' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Wbicie jaj i ser',
        description: 'Wbij jajka we wgłębienia, posyp pokruszoną fetą, przykryj pokrywką na 4-5 minut do ścięcia białka.',
        durationMinutes: 5,
        stepIngredients: [
          { name: 'Jajka wiejskie', amountBase: 3, unit: 'szt.', scalable: true, icon: 'egg' },
          { name: 'Ser feta oryginalny', amountBase: 80, unit: 'g', scalable: true, icon: 'cheese' },
          { name: 'Świeżo mielony pieprz', amount: 'do smaku', icon: 'scatter_plot' }
        ]
      }
    ]
  },
  {
    id: 'zupa-krem-pomidory',
    title: 'Zupa Krem z Pieczonych Pomidorów',
    subtitle: 'Obiad w 30 min',
    categoryLabel: 'Szybkie obiady (<25 min)',
    author: 'Kuchnia polska & włoska',
    authorAvatar: 'KP',
    authorSourceUrl: '#',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwFpNMLT4KsTio-XlHaHkFxicgBv-U7iMuZF-TtPRetXt0hYIoQOo54FMrW8nM5JarRckMTtSEHLlSAvjHWLhiR5jV5-OLrLbB5cj6oEj_sC2Mf53IFe_l6G_1ZOBI84bfslMXKtYf6x4he75DTPloOgTtRqGH9gFBkSjaVSPr4roAxBddDX95Ga3ELclVDVCom-ILZhCxPrz3oWdX50Ti4h4Q3tHcRVE0VnYQjQjJ8JDr9UY1LjGR',
    imageAlt: 'Velvety roasted tomato cream soup served in a dark ceramic bowl with a swirl of heavy cream, basil oil droplets, and toasted garlic sourdough bread croutons',
    durationMinutes: 30,
    estimatedPrice: 'ok. 16 zł',
    numericPrice: 16.00,
    caloriesText: '320 kcal',
    category: 'Kuchnia polska',
    cuisine: 'Polska',
    verified: true,
    baseServings: 4,
    ingredients: [
      { id: 'zk-1', name: 'pomidorów malinowych do pieczenia', categoryDetail: 'Słodkie pomidory', amountBase: 1000, unit: 'g pomidorów', inFridge: true, scalable: true, icon: 'nutrition' },
      { id: 'zk-2', name: 'główka czosnku', categoryDetail: 'Pieczony w całości', amountBase: 1, unit: 'główka czosnku', inFridge: true, scalable: false, icon: 'restaurant_menu' },
      { id: 'zk-3', name: 'oliwy z oliwek', categoryDetail: 'Extra Virgin', amountBase: 40, unit: 'ml oliwy', inFridge: true, scalable: true, icon: 'water_drop' },
      { id: 'zk-4', name: 'śmietanki 30%', categoryDetail: 'Kremowość', amountBase: 100, unit: 'ml śmietanki', inFridge: true, scalable: true, icon: 'water_drop' },
      { id: 'zk-5', name: 'świeżej bazylii', categoryDetail: 'Aromat na koniec', amountBase: 1, unit: 'doniczka bazylii', inFridge: false, scalable: false, icon: 'eco', estimatedPrice: 4.99, store: 'Biedronka' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pieczenie warzyw',
        description: 'Pomidory i główkę czosnku przekrój, skrop oliwą i piecz 25 min w 200°C.',
        durationMinutes: 25,
        stepIngredients: [
          { name: 'Pomidory malinowe', amountBase: 1000, unit: 'g', scalable: true, icon: 'nutrition' },
          { name: 'Główka czosnku', amount: '1 szt.', icon: 'restaurant_menu' },
          { name: 'Oliwa z oliwek', amountBase: 40, unit: 'ml', scalable: true, icon: 'water_drop' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Blendowanie',
        description: 'Wyciśnij upieczony czosnek, zblenduj z pomidorami i bulionem na gładki krem.',
        durationMinutes: 5,
        stepIngredients: [
          { name: 'Upieczone pomidory i czosnek', amount: 'z blachy', icon: 'nutrition' },
          { name: 'Bulion warzywny', amount: '250 ml', icon: 'soup_kitchen' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Doprawienie i śmietanka',
        description: 'Dodaj śmietankę, sól, pieprz i podawaj z listkami świeżej bazylii.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Śmietanka 30%', amountBase: 100, unit: 'ml', scalable: true, icon: 'water_drop' },
          { name: 'Świeża bazylia', amount: 'kilka listków', icon: 'eco' },
          { name: 'Sól i pieprz', amount: 'do smaku', icon: 'scatter_plot' }
        ]
      }
    ]
  },
  {
    id: 'penne-arrabbiata',
    title: "Penne all'Arrabbiata z Oliwkami",
    subtitle: 'Pikantny makaron rzymski',
    categoryLabel: 'Makarony & Risotto',
    author: 'Foxx Gotuje',
    authorAvatar: 'FG',
    authorSourceUrl: 'https://youtube.com/@FoxxGotuje',
    authorSlug: 'foxx',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAr253bRRF5Aiye4lgPlGAckuzj05ggdj87ZjnUUs_HgoB86zHN5JcJ6RRf5YhDciEZH2TquwU7TxfFNcFN8rEVH6NdueUQ7pbEA4YFtl1FwVO-MCpRywcycPotfFLZXEW1pz3cPGgpt2Jtlc4YD3HlJz4x-A8FEUaZimeeICgX5c1bbq3PhptNrlzYRb2vaXFijyoZHP-9cfAxqlWlEPT8ICJeEukznOXSvJH5npqyGuGVDZEusDDe',
    imageAlt: "Vibrant Penne all'Arrabbiata pasta with glossy fiery red tomato sauce kalamata black olives fresh basil sprig and extra virgin olive oil swirl",
    durationMinutes: 20,
    estimatedPrice: 'ok. 14 zł',
    numericPrice: 14.00,
    caloriesText: '440 kcal',
    category: 'Makarony & Risotto',
    cuisine: 'Włoska',
    verified: true,
    baseServings: 2,
    ingredients: [
      { id: 'pa-1', name: 'makaronu penne rigate', categoryDetail: 'Makaron z rurkami', amountBase: 200, unit: 'g makaronu penne', inFridge: true, scalable: true, icon: 'grain' },
      { id: 'pa-2', name: 'pomidorów passata', categoryDetail: 'Przecier pomidorowy', amountBase: 350, unit: 'ml passaty', inFridge: true, scalable: true, icon: 'soup_kitchen' },
      { id: 'pa-3', name: 'papryczek peperoncino / chili', categoryDetail: 'Ostrość', amountBase: 1, unit: 'szt. papryczki chili', inFridge: true, scalable: false, icon: 'local_fire_department' },
      { id: 'pa-4', name: 'czosnku', categoryDetail: 'Ząbki', amountBase: 3, unit: 'ząbki czosnku', inFridge: true, scalable: true, icon: 'restaurant_menu' },
      { id: 'pa-5', name: 'oliwek czarnych', categoryDetail: 'Kalamata bez pestek', amountBase: 50, unit: 'g oliwek', inFridge: true, scalable: true, icon: 'scatter_plot' },
      { id: 'pa-6', name: 'oliwy z oliwek', categoryDetail: 'Tłuszcz', amountBase: 30, unit: 'ml oliwy', inFridge: true, scalable: true, icon: 'water_drop' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Podsmażenie czosnku i chili',
        description: 'Na oliwie powoli podsmażaj czosnek i posiekane peperoncino.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Czosnek', amountBase: 3, unit: 'ząbki', scalable: true, icon: 'restaurant_menu' },
          { name: 'Papryczka peperoncino', amount: '1 szt.', icon: 'local_fire_department' },
          { name: 'Oliwa z oliwek', amountBase: 30, unit: 'ml', scalable: true, icon: 'water_drop' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Sos arrabbiata',
        description: 'Wlej passatę, dodaj oliwki i gotuj na wolnym ogniu przez 12 minut.',
        durationMinutes: 12,
        stepIngredients: [
          { name: 'Passata pomidorowa', amountBase: 350, unit: 'ml', scalable: true, icon: 'soup_kitchen' },
          { name: 'Oliwki czarne Kalamata', amountBase: 50, unit: 'g', scalable: true, icon: 'scatter_plot' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Wymieszanie z penne',
        description: 'Wrzuć ugotowane penne přímo do gęstego sosu, obtocz energicznie.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Makaron penne rigate', amountBase: 200, unit: 'g', scalable: true, icon: 'grain' },
          { name: 'Gorący sos arrabbiata', amount: 'z patelni', icon: 'soup_kitchen' }
        ]
      }
    ]
  },
  {
    id: 'makaron-czosnkowo-ziolowy',
    title: 'Makaron Czosnkowo-Ziołowy',
    subtitle: 'Domowy klasyk',
    categoryLabel: 'Makarony & Risotto',
    author: 'Domowy klasyk',
    authorAvatar: 'DK',
    authorSourceUrl: '#',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKigSZBA9WIh23eh2V95mCEXa-J7bXCbC50n18Vfn7JnvSuCe7RdTu7JvxXbGGVzkxIAGbDr_5MXmtbGHRKJ1pX9gXXd5jCfRZPWPz5q_TqMOhGfn-5aEaUz7_784AeeoQUps5A7yrpIW5RSRXzjz3Nrz1h01Gc4Wn1Cx-B9FusuBH6znbLkZaWDQzmTWdiBXuI9mQAivbFQybPhPA7w-YYSAAfb2qdTOQ4KTuzU_D8KSNSYHjpRMK',
    imageAlt: 'Fresh warm garlic butter noodles in a minimalist ceramic dish, melted herb butter gloss, golden roasted garlic slices, parsley sprinkle',
    durationMinutes: 12,
    estimatedPrice: 'ok. 10 zł',
    numericPrice: 10.00,
    caloriesText: '410 kcal',
    category: 'Makarony & Risotto',
    cuisine: 'Włoska',
    verified: false,
    baseServings: 2,
    ingredients: [
      { id: 'mcz-1', name: 'makaronu tagliatelle lub spaghetti', categoryDetail: 'Wstążki', amountBase: 200, unit: 'g makaronu', inFridge: true, scalable: true, icon: 'grain' },
      { id: 'mcz-2', name: 'masła 82%', categoryDetail: 'Kremowa baza', amountBase: 50, unit: 'g masła', inFridge: true, scalable: true, icon: 'lunch_dining' },
      { id: 'mcz-3', name: 'czosnku w płatkach', categoryDetail: 'Aromat', amountBase: 4, unit: 'ząbki czosnku', inFridge: true, scalable: true, icon: 'restaurant_menu' },
      { id: 'mcz-4', name: 'oliwy z oliwek', categoryDetail: 'Tłuszcz', amountBase: 20, unit: 'ml oliwy', inFridge: true, scalable: true, icon: 'water_drop' },
      { id: 'mcz-5', name: 'świeżej natki pietruszki', categoryDetail: 'Brakujący składnik', amountBase: 1, unit: 'pęczek natki', inFridge: false, scalable: false, icon: 'spa', estimatedPrice: 2.99 },
      { id: 'mcz-6', name: 'sera parmezan', categoryDetail: 'Brakujący składnik', amountBase: 30, unit: 'g parmezanu', inFridge: false, scalable: true, icon: 'cheese', estimatedPrice: 5.99 }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Gotowanie makaronu',
        description: 'Ugotuj makaron w osolonej wodzie o 2 minuty krócej niż podano.',
        durationMinutes: 8,
        stepIngredients: [
          { name: 'Makaron tagliatelle lub spaghetti', amountBase: 200, unit: 'g', scalable: true, icon: 'grain' },
          { name: 'Woda i sól', amount: 'do garnka', icon: 'water_drop' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Złocisty czosnek',
        description: 'Na maśle z oliwą zeszklij delikatnie płatki czosnku, nie przypalając ich.',
        durationMinutes: 3,
        stepIngredients: [
          { name: 'Masło 82%', amountBase: 50, unit: 'g', scalable: true, icon: 'lunch_dining' },
          { name: 'Oliwa z oliwek', amountBase: 20, unit: 'ml', scalable: true, icon: 'water_drop' },
          { name: 'Czosnek w płatkach', amountBase: 4, unit: 'ząbki', scalable: true, icon: 'restaurant_menu' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Emulsja masłowa',
        description: 'Połącz makaron z masłem i odrobiną wody z gotowania, posyp natką i parmezanem.',
        durationMinutes: 2,
        stepIngredients: [
          { name: 'Świeża natka pietruszki', amount: '1 pęczek posiekany', icon: 'spa' },
          { name: 'Ser parmezan', amountBase: 30, unit: 'g', scalable: true, icon: 'cheese' },
          { name: 'Woda z gotowania makaronu', amount: '2-3 łyżki', icon: 'water_drop' }
        ]
      }
    ]
  }
];

export const INITIAL_SHOPPING_ITEMS: ShoppingItem[] = [
  {
    id: 'shop-1',
    title: 'Świeże borowiki 300 g',
    subtitle: 'Główny składnik · 1 opakowanie',
    price: 19.99,
    storeName: 'Carrefour (katalog)',
    isBought: false,
    group: 'pappardelle',
    groupTitle: 'Kremowe Pappardelle',
    groupIcon: 'dinner_dining'
  },
  {
    id: 'shop-2',
    title: 'Świeży tymianek',
    subtitle: 'Doniczka / pęczek',
    price: 4.49,
    storeName: 'Biedronka (paragon)',
    isBought: false,
    group: 'pappardelle',
    groupTitle: 'Kremowe Pappardelle',
    groupIcon: 'dinner_dining'
  },
  {
    id: 'shop-3',
    title: 'Pomidory krojone w puszce 400g',
    subtitle: 'Kupiono',
    price: 4.19,
    isBought: true,
    group: 'szakszuka',
    groupTitle: 'Szakszuka',
    groupIcon: 'egg'
  },
  {
    id: 'shop-4',
    title: 'Ser Feta 150 g',
    subtitle: 'Kupiono',
    price: 5.80,
    isBought: true,
    group: 'szakszuka',
    groupTitle: 'Szakszuka',
    groupIcon: 'egg'
  },
  {
    id: 'shop-5',
    title: 'Kawa ziarnista Arabica 500g',
    subtitle: 'Wpis własny',
    price: 0,
    isBought: false,
    group: 'custom',
    groupTitle: 'Inne / Dodane ręcznie',
    groupIcon: 'add_shopping_cart',
    isManualPrice: true
  }
];

export const DEFAULT_FRIDGE_PRODUCTS = [
  'Jajka',
  'Czosnek',
  'Makaron',
  'Boczek',
  'Śmietanka',
  'Masło'
];

export const ALL_PANTRY_OPTIONS = [
  { name: 'Jajka', emoji: '🥚', defaultSelected: true },
  { name: 'Czosnek', emoji: '🧄', defaultSelected: true },
  { name: 'Makaron', emoji: '🍝', defaultSelected: true },
  { name: 'Boczek', emoji: '🥓', defaultSelected: true },
  { name: 'Śmietanka', emoji: '🥛', defaultSelected: true },
  { name: 'Masło', emoji: '🧈', defaultSelected: true },
  { name: 'Pieczarki / Grzyby', emoji: '🍄', defaultSelected: false },
  { name: 'Parmezan / Grana Padano', emoji: '🧀', defaultSelected: false },
  { name: 'Pomidory krojone', emoji: '🍅', defaultSelected: false },
  { name: 'Oliwa z oliwek', emoji: '🫒', defaultSelected: true },
  { name: 'Cebula', emoji: '🧅', defaultSelected: true },
  { name: 'Szpinak', emoji: '🥬', defaultSelected: false },
  { name: 'Tymianek', emoji: '🌿', defaultSelected: false }
];

export const RECIPES = RECIPES_DATA;
export const CHEFS = CHEFS_DATA;
export const INITIAL_FRIDGE_INGREDIENTS = DEFAULT_FRIDGE_PRODUCTS;
