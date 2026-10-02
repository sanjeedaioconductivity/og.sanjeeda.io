// OfferGuide — geography seed data (all countries + their major cities).
//
// LOCATION: src/lib/offerguide/geoData.js
//
// WHY THIS FILE EXISTS
// OgGeography previously held 2 countries and 5 cities, so both location
// dropdowns were effectively unusable outside Pakistan and the UAE. This is the
// source data that seeds the full list.
//
// COUNTRY NAMES ARE NOT STORED HERE.
// Only ISO 3166-1 alpha-2 codes are listed. The display name is resolved at
// render time with `Intl.DisplayNames`, which ships with the browser and knows
// every country in every locale. That means the country dropdown translates
// itself for free in any language we add later — no translation file, no
// maintenance. `countryName` is still written into Mongo at seed time as an
// English fallback for server-side use and for older runtimes.
//
// CITIES ARE ENGLISH ONLY.
// There is no Intl equivalent for settlements, so these are stored as written.
// They are SUGGESTIONS, not a constraint: current_city / offer_city are plain
// free-text columns in MySQL (see the OgGeography model note), and the UI keeps
// a "use what I typed" escape hatch. A missing city is therefore a cosmetic gap,
// never a blocker — which is what makes a curated list acceptable here instead
// of a 150k-row global gazetteer behind a search endpoint.
//
// Cities are comma-separated rather than arrays purely to keep this file
// readable and diffable; `parseGeoData()` below splits them.

/**
 * ISO 3166-1 alpha-2 → major cities.
 * Ordered roughly by population/prominence so the most likely pick sits first.
 */
export const COUNTRY_CITIES = {
  // ---------------------------------------------------------------- Asia ---
  PK: 'Karachi,Lahore,Faisalabad,Rawalpindi,Gujranwala,Peshawar,Multan,Islamabad,Quetta,Sialkot,Bahawalpur,Sargodha,Sukkur,Larkana,Sheikhupura,Rahim Yar Khan,Jhang,Dera Ghazi Khan,Gujrat,Sahiwal,Wah Cantonment,Mardan,Kasur,Okara,Mingora,Nawabshah,Chiniot,Kotri,Kamoke,Hafizabad,Kohat,Jacobabad,Shikarpur,Muzaffargarh,Khanpur,Gojra,Bahawalnagar,Abbottabad,Muridke,Pakpattan,Khuzdar,Jhelum,Dadu,Mirpur Khas,Nowshera,Burewala,Kohlu,Gilgit,Skardu,Muzaffarabad,Mirpur',
  IN: 'Mumbai,Delhi,Bengaluru,Hyderabad,Ahmedabad,Chennai,Kolkata,Pune,Jaipur,Surat,Lucknow,Kanpur,Nagpur,Indore,Thane,Bhopal,Visakhapatnam,Patna,Vadodara,Ghaziabad,Ludhiana,Agra,Nashik,Faridabad,Meerut,Rajkot,Varanasi,Srinagar,Aurangabad,Dhanbad,Amritsar,Navi Mumbai,Allahabad,Ranchi,Howrah,Coimbatore,Jabalpur,Gwalior,Vijayawada,Jodhpur,Madurai,Raipur,Kota,Chandigarh,Guwahati,Mysuru,Noida,Gurugram,Kochi,Thiruvananthapuram',
  BD: 'Dhaka,Chattogram,Khulna,Rajshahi,Sylhet,Barishal,Rangpur,Mymensingh,Comilla,Narayanganj,Gazipur,Bogra,Jessore,Dinajpur,Tangail,Cox’s Bazar,Pabna,Naogaon,Feni,Brahmanbaria',
  LK: 'Colombo,Dehiwala-Mount Lavinia,Moratuwa,Negombo,Kandy,Sri Jayawardenepura Kotte,Galle,Trincomalee,Jaffna,Batticaloa,Matara,Kurunegala,Anuradhapura,Ratnapura,Badulla',
  NP: 'Kathmandu,Pokhara,Lalitpur,Bharatpur,Biratnagar,Birgunj,Dharan,Butwal,Hetauda,Janakpur,Nepalgunj,Itahari,Dhangadhi',
  AF: 'Kabul,Kandahar,Herat,Mazar-i-Sharif,Jalalabad,Kunduz,Ghazni,Lashkargah,Taloqan,Puli Khumri',
  CN: 'Shanghai,Beijing,Shenzhen,Guangzhou,Chengdu,Tianjin,Wuhan,Xi’an,Hangzhou,Chongqing,Nanjing,Shenyang,Qingdao,Dalian,Suzhou,Zhengzhou,Jinan,Changsha,Kunming,Xiamen,Ningbo,Hefei,Fuzhou,Harbin,Wuxi',
  HK: 'Hong Kong,Kowloon,Tsuen Wan,Sha Tin,Tuen Mun,Yuen Long,Tai Po',
  MO: 'Macau',
  TW: 'Taipei,New Taipei,Kaohsiung,Taichung,Tainan,Taoyuan,Hsinchu,Keelung,Chiayi',
  JP: 'Tokyo,Yokohama,Osaka,Nagoya,Sapporo,Fukuoka,Kobe,Kyoto,Kawasaki,Saitama,Hiroshima,Sendai,Chiba,Kitakyushu,Sakai,Niigata,Hamamatsu,Kumamoto,Okayama,Shizuoka',
  KR: 'Seoul,Busan,Incheon,Daegu,Daejeon,Gwangju,Suwon,Ulsan,Changwon,Seongnam,Goyang,Yongin,Bucheon,Ansan,Cheongju,Jeonju,Jeju',
  KP: 'Pyongyang,Hamhung,Chongjin,Nampo,Wonsan,Sinuiju,Kaesong',
  MN: 'Ulaanbaatar,Erdenet,Darkhan,Choibalsan',
  SG: 'Singapore',
  MY: 'Kuala Lumpur,George Town,Ipoh,Shah Alam,Petaling Jaya,Johor Bahru,Malacca City,Kota Kinabalu,Kuching,Seremban,Kuantan,Alor Setar,Miri,Subang Jaya,Putrajaya,Cyberjaya',
  ID: 'Jakarta,Surabaya,Bandung,Medan,Semarang,Makassar,Palembang,Batam,Depok,Tangerang,Bekasi,Bogor,Denpasar,Yogyakarta,Malang,Padang,Pekanbaru,Balikpapan,Samarinda,Manado',
  TH: 'Bangkok,Nonthaburi,Chiang Mai,Pattaya,Phuket,Hat Yai,Nakhon Ratchasima,Udon Thani,Khon Kaen,Chonburi,Rayong,Surat Thani,Ayutthaya',
  VN: 'Ho Chi Minh City,Hanoi,Da Nang,Hai Phong,Can Tho,Bien Hoa,Nha Trang,Hue,Vung Tau,Buon Ma Thuot,Quy Nhon,Thu Dau Mot',
  PH: 'Manila,Quezon City,Davao City,Caloocan,Cebu City,Zamboanga City,Taguig,Pasig,Antipolo,Makati,Bacolod,Iloilo City,Cagayan de Oro,General Santos,Baguio,Angeles,Mandaluyong,Parañaque',
  KH: 'Phnom Penh,Siem Reap,Battambang,Sihanoukville,Poipet,Kampong Cham',
  LA: 'Vientiane,Pakse,Savannakhet,Luang Prabang',
  MM: 'Yangon,Mandalay,Naypyidaw,Bago,Mawlamyine,Taunggyi',
  BN: 'Bandar Seri Begawan,Kuala Belait,Seria,Tutong',
  TL: 'Dili,Baucau,Maliana',
  BT: 'Thimphu,Phuntsholing,Paro,Punakha',
  MV: 'Malé,Addu City,Fuvahmulah,Hulhumalé',

  // -------------------------------------------------- Middle East / Gulf ---
  AE: 'Dubai,Abu Dhabi,Sharjah,Al Ain,Ajman,Ras Al Khaimah,Fujairah,Umm Al Quwain,Khor Fakkan,Dibba Al-Fujairah',
  SA: 'Riyadh,Jeddah,Mecca,Medina,Dammam,Khobar,Dhahran,Tabuk,Buraidah,Khamis Mushait,Hail,Najran,Jubail,Abha,Yanbu,Taif,Al Qatif,Jazan',
  QA: 'Doha,Al Rayyan,Al Wakrah,Umm Salal,Al Khor,Lusail,Mesaieed,Dukhan',
  KW: 'Kuwait City,Al Ahmadi,Hawalli,Al Farwaniyah,Salmiya,Jahra,Fahaheel,Mangaf',
  BH: 'Manama,Riffa,Muharraq,Hamad Town,Isa Town,Sitra,Budaiya,Zallaq',
  OM: 'Muscat,Salalah,Sohar,Nizwa,Sur,Ibri,Barka,Rustaq,Seeb',
  YE: 'Sanaa,Aden,Taiz,Hodeidah,Ibb,Mukalla,Seiyun',
  IQ: 'Baghdad,Basra,Mosul,Erbil,Najaf,Karbala,Sulaymaniyah,Kirkuk,Nasiriyah,Duhok,Ramadi,Fallujah',
  IR: 'Tehran,Mashhad,Isfahan,Karaj,Shiraz,Tabriz,Qom,Ahvaz,Kermanshah,Urmia,Rasht,Zahedan,Hamadan,Kerman,Yazd,Bandar Abbas',
  JO: 'Amman,Zarqa,Irbid,Russeifa,Aqaba,Madaba,Salt',
  LB: 'Beirut,Tripoli,Sidon,Tyre,Jounieh,Zahle,Byblos',
  SY: 'Damascus,Aleppo,Homs,Latakia,Hama,Tartus,Deir ez-Zor',
  IL: 'Jerusalem,Tel Aviv,Haifa,Rishon LeZion,Petah Tikva,Ashdod,Netanya,Beersheba,Holon,Herzliya,Ramat Gan',
  PS: 'Gaza,Hebron,Nablus,Ramallah,Bethlehem,Jenin,Khan Yunis,Rafah',
  TR: 'Istanbul,Ankara,Izmir,Bursa,Antalya,Adana,Konya,Gaziantep,Mersin,Kayseri,Eskisehir,Diyarbakir,Samsun,Denizli,Trabzon,Sakarya',
  CY: 'Nicosia,Limassol,Larnaca,Famagusta,Paphos,Kyrenia',
  GE: 'Tbilisi,Batumi,Kutaisi,Rustavi,Zugdidi',
  AM: 'Yerevan,Gyumri,Vanadzor,Vagharshapat',
  AZ: 'Baku,Ganja,Sumqayit,Mingachevir,Lankaran',

  // -------------------------------------------------------- Central Asia ---
  KZ: 'Almaty,Astana,Shymkent,Karaganda,Aktobe,Taraz,Pavlodar,Oskemen,Atyrau,Kostanay',
  UZ: 'Tashkent,Samarkand,Namangan,Andijan,Bukhara,Nukus,Fergana,Qarshi',
  TM: 'Ashgabat,Turkmenabat,Dashoguz,Mary,Balkanabat',
  KG: 'Bishkek,Osh,Jalal-Abad,Karakol,Tokmok',
  TJ: 'Dushanbe,Khujand,Bokhtar,Kulob,Istaravshan',

  // ------------------------------------------------------------- Europe ---
  GB: 'London,Birmingham,Manchester,Glasgow,Leeds,Liverpool,Newcastle upon Tyne,Sheffield,Bristol,Edinburgh,Leicester,Coventry,Nottingham,Cardiff,Belfast,Brighton,Southampton,Reading,Milton Keynes,Aberdeen,Cambridge,Oxford,York,Bradford,Stoke-on-Trent,Wolverhampton,Plymouth,Derby,Swansea,Luton',
  IE: 'Dublin,Cork,Limerick,Galway,Waterford,Drogheda,Dundalk,Bray,Kilkenny',
  FR: 'Paris,Marseille,Lyon,Toulouse,Nice,Nantes,Montpellier,Strasbourg,Bordeaux,Lille,Rennes,Reims,Toulon,Saint-Étienne,Le Havre,Grenoble,Dijon,Angers,Aix-en-Provence,Nancy',
  DE: 'Berlin,Hamburg,Munich,Cologne,Frankfurt,Stuttgart,Düsseldorf,Leipzig,Dortmund,Essen,Bremen,Dresden,Hanover,Nuremberg,Duisburg,Bochum,Wuppertal,Bielefeld,Bonn,Münster,Karlsruhe,Mannheim,Augsburg,Wiesbaden',
  NL: 'Amsterdam,Rotterdam,The Hague,Utrecht,Eindhoven,Groningen,Tilburg,Almere,Breda,Nijmegen,Haarlem,Arnhem,Maastricht,Delft',
  BE: 'Brussels,Antwerp,Ghent,Charleroi,Liège,Bruges,Namur,Leuven,Mons',
  LU: 'Luxembourg City,Esch-sur-Alzette,Differdange,Dudelange',
  CH: 'Zurich,Geneva,Basel,Bern,Lausanne,Winterthur,Lucerne,St. Gallen,Lugano,Zug',
  AT: 'Vienna,Graz,Linz,Salzburg,Innsbruck,Klagenfurt,Villach',
  IT: 'Rome,Milan,Naples,Turin,Palermo,Genoa,Bologna,Florence,Bari,Catania,Venice,Verona,Messina,Padua,Trieste,Brescia,Parma,Modena',
  ES: 'Madrid,Barcelona,Valencia,Seville,Zaragoza,Málaga,Murcia,Palma,Las Palmas,Bilbao,Alicante,Córdoba,Valladolid,Vigo,Gijón,Granada,A Coruña,Santander',
  PT: 'Lisbon,Porto,Amadora,Braga,Setúbal,Coimbra,Funchal,Faro,Aveiro',
  GR: 'Athens,Thessaloniki,Patras,Heraklion,Larissa,Volos,Rhodes,Ioannina,Chania',
  MT: 'Valletta,Birkirkara,Sliema,St. Julian’s,Mosta,Qormi',
  PL: 'Warsaw,Kraków,Łódź,Wrocław,Poznań,Gdańsk,Szczecin,Bydgoszcz,Lublin,Katowice,Białystok,Gdynia,Częstochowa,Radom,Rzeszów',
  CZ: 'Prague,Brno,Ostrava,Plzeň,Liberec,Olomouc,České Budějovice,Hradec Králové',
  SK: 'Bratislava,Košice,Prešov,Žilina,Nitra,Banská Bystrica,Trnava',
  HU: 'Budapest,Debrecen,Szeged,Miskolc,Pécs,Győr,Nyíregyháza,Kecskemét',
  RO: 'Bucharest,Cluj-Napoca,Timișoara,Iași,Constanța,Craiova,Brașov,Galați,Ploiești,Oradea,Sibiu',
  BG: 'Sofia,Plovdiv,Varna,Burgas,Ruse,Stara Zagora,Pleven',
  HR: 'Zagreb,Split,Rijeka,Osijek,Zadar,Dubrovnik,Pula',
  SI: 'Ljubljana,Maribor,Celje,Kranj,Koper',
  RS: 'Belgrade,Novi Sad,Niš,Kragujevac,Subotica,Zrenjanin',
  BA: 'Sarajevo,Banja Luka,Tuzla,Zenica,Mostar,Bihać',
  MK: 'Skopje,Bitola,Kumanovo,Prilep,Tetovo',
  AL: 'Tirana,Durrës,Vlorë,Shkodër,Elbasan,Fier',
  ME: 'Podgorica,Nikšić,Herceg Novi,Budva,Bar',
  XK: 'Pristina,Prizren,Peja,Gjakova,Gjilan,Mitrovica',
  SE: 'Stockholm,Gothenburg,Malmö,Uppsala,Västerås,Örebro,Linköping,Helsingborg,Jönköping,Lund,Umeå',
  NO: 'Oslo,Bergen,Trondheim,Stavanger,Drammen,Kristiansand,Tromsø,Sandnes',
  DK: 'Copenhagen,Aarhus,Odense,Aalborg,Esbjerg,Roskilde,Kolding',
  FI: 'Helsinki,Espoo,Tampere,Vantaa,Oulu,Turku,Jyväskylä,Lahti,Kuopio',
  IS: 'Reykjavík,Kópavogur,Hafnarfjörður,Akureyri',
  EE: 'Tallinn,Tartu,Narva,Pärnu',
  LV: 'Riga,Daugavpils,Liepāja,Jēlgava',
  LT: 'Vilnius,Kaunas,Klaipėda,Šiauliai,Panevėžys',
  BY: 'Minsk,Gomel,Mogilev,Vitebsk,Grodno,Brest',
  UA: 'Kyiv,Kharkiv,Odesa,Dnipro,Donetsk,Zaporizhzhia,Lviv,Kryvyi Rih,Mykolaiv,Vinnytsia,Poltava',
  MD: 'Chișinău,Bălți,Tiraspol,Bender',
  RU: 'Moscow,Saint Petersburg,Novosibirsk,Yekaterinburg,Kazan,Nizhny Novgorod,Chelyabinsk,Samara,Omsk,Rostov-on-Don,Ufa,Krasnoyarsk,Perm,Voronezh,Volgograd,Krasnodar,Sochi,Vladivostok',
  AD: 'Andorra la Vella,Escaldes-Engordany',
  MC: 'Monaco',
  SM: 'San Marino,Serravalle',
  LI: 'Vaduz,Schaan',
  VA: 'Vatican City',

  // ------------------------------------------------------ North America ---
  US: 'New York,Los Angeles,Chicago,Houston,Phoenix,Philadelphia,San Antonio,San Diego,Dallas,San Jose,Austin,Jacksonville,Fort Worth,Columbus,Charlotte,San Francisco,Indianapolis,Seattle,Denver,Boston,Washington,Nashville,Detroit,Portland,Las Vegas,Memphis,Louisville,Baltimore,Milwaukee,Atlanta,Miami,Raleigh,Minneapolis,Tampa,New Orleans,Pittsburgh,Cincinnati,Kansas City,Sacramento,Orlando,San Juan,St. Louis,Salt Lake City,Cleveland,Rochester',
  CA: 'Toronto,Montreal,Vancouver,Calgary,Edmonton,Ottawa,Winnipeg,Quebec City,Hamilton,Kitchener,London,Victoria,Halifax,Oshawa,Windsor,Saskatoon,Regina,Mississauga,Brampton,Surrey,Burnaby,Markham',
  MX: 'Mexico City,Guadalajara,Monterrey,Puebla,Tijuana,León,Juárez,Zapopan,Querétaro,Cancún,Mérida,San Luis Potosí,Aguascalientes,Hermosillo,Saltillo,Mexicali,Culiacán,Chihuahua',
  GT: 'Guatemala City,Mixco,Villa Nueva,Quetzaltenango,Escuintla',
  BZ: 'Belize City,Belmopan,San Ignacio,Orange Walk',
  SV: 'San Salvador,Santa Ana,Soyapango,San Miguel',
  HN: 'Tegucigalpa,San Pedro Sula,Choloma,La Ceiba',
  NI: 'Managua,León,Masaya,Chinandega,Granada',
  CR: 'San José,Limón,Alajuela,Heredia,Cartago,Liberia',
  PA: 'Panama City,Colón,David,Santiago,La Chorrera',
  CU: 'Havana,Santiago de Cuba,Camagüey,Holguín,Santa Clara',
  DO: 'Santo Domingo,Santiago de los Caballeros,La Romana,Puerto Plata,Punta Cana',
  HT: 'Port-au-Prince,Cap-Haïtien,Gonaïves,Les Cayes',
  JM: 'Kingston,Montego Bay,Spanish Town,Portmore,Ocho Rios',
  TT: 'Port of Spain,San Fernando,Chaguanas,Arima',
  BS: 'Nassau,Freeport',
  BB: 'Bridgetown,Speightstown',
  PR: 'San Juan,Bayamón,Carolina,Ponce,Caguas',

  // ------------------------------------------------------ South America ---
  BR: 'São Paulo,Rio de Janeiro,Brasília,Salvador,Fortaleza,Belo Horizonte,Manaus,Curitiba,Recife,Porto Alegre,Belém,Goiânia,Guarulhos,Campinas,São Luís,Maceió,Natal,Campo Grande,João Pessoa,Florianópolis,Vitória',
  AR: 'Buenos Aires,Córdoba,Rosario,Mendoza,La Plata,Tucumán,Mar del Plata,Salta,Santa Fe,San Juan,Neuquén',
  CL: 'Santiago,Valparaíso,Concepción,Antofagasta,Viña del Mar,Temuco,La Serena,Iquique,Puerto Montt',
  CO: 'Bogotá,Medellín,Cali,Barranquilla,Cartagena,Cúcuta,Bucaramanga,Pereira,Santa Marta,Manizales',
  PE: 'Lima,Arequipa,Trujillo,Chiclayo,Piura,Cusco,Iquitos,Huancayo,Tacna',
  VE: 'Caracas,Maracaibo,Valencia,Barquisimeto,Maracay,Ciudad Guayana,San Cristóbal',
  EC: 'Quito,Guayaquil,Cuenca,Santo Domingo,Machala,Manta,Ambato',
  BO: 'Santa Cruz de la Sierra,La Paz,Cochabamba,Sucre,Oruro,El Alto',
  PY: 'Asunción,Ciudad del Este,San Lorenzo,Luque,Encarnación',
  UY: 'Montevideo,Salto,Ciudad de la Costa,Paysandú,Punta del Este',
  GY: 'Georgetown,Linden,New Amsterdam',
  SR: 'Paramaribo,Lelydorp,Nieuw Nickerie',

  // ------------------------------------------------------------- Africa ---
  EG: 'Cairo,Alexandria,Giza,Shubra El Kheima,Port Said,Suez,Luxor,Mansoura,Tanta,Asyut,Aswan,Hurghada,Sharm El Sheikh,New Cairo,6th of October City',
  MA: 'Casablanca,Rabat,Fez,Marrakesh,Tangier,Agadir,Meknes,Oujda,Kenitra,Tetouan,Sale',
  DZ: 'Algiers,Oran,Constantine,Annaba,Blida,Batna,Sétif,Djelfa,Sidi Bel Abbès',
  TN: 'Tunis,Sfax,Sousse,Kairouan,Bizerte,Gabès,Ariana,Monastir',
  LY: 'Tripoli,Benghazi,Misrata,Zawiya,Bayda,Tobruk',
  SD: 'Khartoum,Omdurman,Port Sudan,Kassala,Nyala,El Obeid',
  SS: 'Juba,Wau,Malakal,Yei',
  ET: 'Addis Ababa,Dire Dawa,Mekelle,Gondar,Hawassa,Bahir Dar,Adama',
  ER: 'Asmara,Keren,Massawa',
  DJ: 'Djibouti City,Ali Sabieh',
  SO: 'Mogadishu,Hargeisa,Bosaso,Kismayo,Berbera',
  KE: 'Nairobi,Mombasa,Kisumu,Nakuru,Eldoret,Thika,Malindi,Machakos',
  UG: 'Kampala,Gulu,Lira,Mbarara,Jinja,Entebbe',
  TZ: 'Dar es Salaam,Dodoma,Mwanza,Arusha,Mbeya,Zanzibar City,Morogoro',
  RW: 'Kigali,Butare,Gisenyi,Musanze',
  BI: 'Bujumbura,Gitega,Ngozi',
  NG: 'Lagos,Kano,Ibadan,Abuja,Port Harcourt,Benin City,Kaduna,Maiduguri,Zaria,Aba,Jos,Ilorin,Onitsha,Warri,Enugu,Abeokuta,Uyo,Calabar',
  GH: 'Accra,Kumasi,Tamale,Sekondi-Takoradi,Ashaiman,Cape Coast,Tema',
  CI: 'Abidjan,Yamoussoukro,Bouaké,Daloa,San-Pédro,Korhogo',
  SN: 'Dakar,Touba,Thiès,Saint-Louis,Ziguinchor,Kaolack',
  ML: 'Bamako,Sikasso,Mopti,Kayes,Ségou,Gao',
  BF: 'Ouagadougou,Bobo-Dioulasso,Koudougou,Banfora',
  NE: 'Niamey,Zinder,Maradi,Agadez,Tahoua',
  TD: 'N’Djamena,Moundou,Sarh,Abéché',
  MR: 'Nouakchott,Nouadhibou,Rosso,Kiÿa',
  GM: 'Banjul,Serekunda,Brikama',
  GN: 'Conakry,Nzérékoré,Kankan,Kindia',
  GW: 'Bissau,Bafatá,Gabú',
  SL: 'Freetown,Bo,Kenema,Makeni',
  LR: 'Monrovia,Gbarnga,Buchanan,Kakata',
  TG: 'Lomé,Sokodé,Kara,Kpalimé',
  BJ: 'Cotonou,Porto-Novo,Parakou,Djougou,Abomey-Calavi',
  CM: 'Douala,Yaoundé,Garoua,Bamenda,Bafoussam,Maroua,Buea,Kribi',
  CF: 'Bangui,Bimbo,Berbérati',
  GA: 'Libreville,Port-Gentil,Franceville,Oyem',
  GQ: 'Malabo,Bata,Oyala',
  CG: 'Brazzaville,Pointe-Noire,Dolisie',
  CD: 'Kinshasa,Lubumbashi,Mbuji-Mayi,Kisangani,Bukavu,Goma,Kananga',
  AO: 'Luanda,Huambo,Lobito,Benguela,Lubango,Cabinda',
  ZM: 'Lusaka,Kitwe,Ndola,Kabwe,Livingstone,Chingola',
  ZW: 'Harare,Bulawayo,Chitungwiza,Mutare,Gweru,Victoria Falls',
  MW: 'Lilongwe,Blantyre,Mzuzu,Zomba',
  MZ: 'Maputo,Matola,Beira,Nampula,Chimoio,Quelimane,Pemba',
  BW: 'Gaborone,Francistown,Molepolole,Maun,Serowe',
  NA: 'Windhoek,Walvis Bay,Swakopmund,Oshakati,Rundu',
  ZA: 'Johannesburg,Cape Town,Durban,Pretoria,Port Elizabeth,Bloemfontein,East London,Nelspruit,Polokwane,Kimberley,Pietermaritzburg,Soweto,Centurion,Sandton,Stellenbosch',
  LS: 'Maseru,Teyateyaneng,Mafeteng,Leribe',
  SZ: 'Mbabane,Manzini,Lobamba,Nhlangano',
  MG: 'Antananarivo,Toamasina,Antsirabe,Mahajanga,Fianarantsoa,Toliara',
  MU: 'Port Louis,Beau Bassin-Rose Hill,Vacoas-Phoenix,Curepipe,Quatre Bornes,Ebene',
  SC: 'Victoria,Anse Boileau,Beau Vallon',
  KM: 'Moroni,Mutsamudu,Fomboni',
  CV: 'Praia,Mindelo,Santa Maria',
  ST: 'São Tomé,Santo António',

  // ------------------------------------------------------------ Oceania ---
  AU: 'Sydney,Melbourne,Brisbane,Perth,Adelaide,Gold Coast,Canberra,Newcastle,Wollongong,Hobart,Geelong,Townsville,Cairns,Darwin,Toowoomba,Ballarat,Bendigo,Sunshine Coast',
  NZ: 'Auckland,Wellington,Christchurch,Hamilton,Tauranga,Dunedin,Palmerston North,Napier,Nelson,Rotorua,Queenstown',
  FJ: 'Suva,Lautoka,Nadi,Labasa',
  PG: 'Port Moresby,Lae,Mount Hagen,Madang',
  SB: 'Honiara,Gizo,Auki',
  VU: 'Port Vila,Luganville',
  WS: 'Apia',
  TO: 'Nuku’alofa',
  KI: 'Tarawa,Betio',
  FM: 'Palikir,Weno,Kolonia',
  MH: 'Majuro,Ebeye',
  PW: 'Ngerulmud,Koror',
  NR: 'Yaren',
  TV: 'Funafuti',
  NC: 'Nouméa,Mont-Dore,Dumbéa',
  PF: 'Papeete,Faaa,Punaauia',
  GU: 'Hagåtña,Dededo,Tamuning',
};

/** Slug used as `cityId`. Stable, ASCII, and safe as a React key. */
export function toCityId(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')       // strip diacritics
    .replace(/[‘’']/g, '')        // strip apostrophes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Expand COUNTRY_CITIES into OgGeography documents.
 *
 * `countryName` is resolved with Intl where available so the seeded fallback
 * matches what the UI shows; the raw code is the last resort.
 */
export function parseGeoData() {
  let display = null;
  try {
    display = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    display = null;
  }

  return Object.entries(COUNTRY_CITIES).map(([countryCode, cityCsv]) => ({
    countryCode,
    countryName: (() => {
      try {
        return display?.of(countryCode) ?? countryCode;
      } catch {
        return countryCode;
      }
    })(),
    active: true,
    cities: cityCsv
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ cityId: toCityId(name), name, active: true })),
  }));
}
