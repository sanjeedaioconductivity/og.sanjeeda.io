/**
 * Urdu (اردو) dictionary.
 *
 * KEYED BY THE ENGLISH STRING, deliberately. The English copy already lives in
 * _constants/scr0NN.ts and is the source of truth, so keying on it means no
 * screen, label or option list had to be restructured to become translatable —
 * and a missing entry falls through to readable English rather than showing a
 * raw key like `scr008.labels.psychSafety`.
 *
 * DROPDOWN VALUES ARE TRANSLATED FOR DISPLAY ONLY.
 * The entries under "option values" below are the exact strings seeded in
 * OgQuestions and validated by the server byte-for-byte. They are translated
 * here so the candidate reads Urdu; the English original is what gets stored.
 * See _i18n/locales.ts.
 *
 * COVERAGE
 * Structural UI, every dropdown option value, all field labels, section titles,
 * buttons and the results/compare copy are translated. Longer help-text
 * paragraphs are being filled in progressively — anything absent renders in
 * English, which is a visible gap rather than a broken screen. Entries here
 * should be reviewed by a native speaker before launch; they are a working
 * first pass, not a substitute for review.
 */

export const ur: Record<string, string> = {
  // ------------------------------------------------------ option values ----
  // Career stage
  Student: 'طالبِ علم',
  'Entry Level': 'ابتدائی سطح',
  'Mid-Level': 'درمیانی سطح',
  Senior: 'سینئر',
  Leadership: 'قیادت',
  Executive: 'ایگزیکٹو',
  Other: 'دیگر',

  // Yes / no / uncertainty vocabulary (Product Discovery §3.1 — these three are
  // distinct concepts and must not collapse into one word)
  Yes: 'جی ہاں',
  No: 'نہیں',
  'Not sure': 'یقین نہیں',
  'Not clear': 'واضح نہیں',
  'Not applicable': 'لاگو نہیں',

  // Work arrangement
  'On-site': 'دفتر میں',
  Hybrid: 'ہائبرڈ',
  Remote: 'ریموٹ',
  'No preference': 'کوئی ترجیح نہیں',

  // Work location preference
  'Current city': 'موجودہ شہر',
  'Specific city': 'مخصوص شہر',
  'Specific country': 'مخصوص ملک',
  'Open to any location': 'کسی بھی جگہ کے لیے تیار',

  // Employment status / type
  Employed: 'ملازمت پیشہ',
  'Self-Employed': 'خود روزگار',
  'Between jobs': 'ملازمتوں کے درمیان',
  'Not currently working': 'فی الحال کام نہیں کر رہے',
  'Full-time': 'کل وقتی',
  'Part-time': 'جزوقتی',
  Contract: 'معاہدہ',
  Freelance: 'فری لانس',
  Temporary: 'عارضی',

  // Pay frequency / period
  Monthly: 'ماہانہ',
  Annually: 'سالانہ',

  // Evaluation setup
  'One offer': 'ایک آفر',
  'Multiple offers': 'متعدد آفرز',
  'New job offer': 'نئی ملازمت کی آفر',
  'Promotion offer': 'ترقی کی آفر',
  'Internal transfer': 'داخلی تبادلہ',
  Counteroffer: 'جوابی آفر',

  // Priorities / categories
  Salary: 'تنخواہ',
  Growth: 'ترقی',
  Stability: 'استحکام',
  Flexibility: 'لچک',
  Benefits: 'مراعات',
  Culture: 'کلچر',
  Commute: 'آمد و رفت',
  Purpose: 'مقصد',
  'Work-Life': 'کام اور زندگی',

  // Culture & manager scales
  Strong: 'مضبوط',
  Positive: 'مثبت',
  Neutral: 'غیر جانبدار',
  Concerning: 'تشویشناک',
  Mixed: 'ملا جلا',
  Weak: 'کمزور',
  Negative: 'منفی',
  High: 'زیادہ',
  Medium: 'درمیانہ',
  Low: 'کم',
  Healthy: 'صحت مند',
  'Very high': 'بہت زیادہ',
  Stable: 'مستحکم',
  Changing: 'تبدیل ہو رہا',
  Approachable: 'قابلِ رسائی',
  Distant: 'دور',

  // Red flags
  'Unclear role': 'غیر واضح کردار',
  'Poor communication': 'ناقص رابطہ',
  'Unrealistic expectations': 'غیر حقیقی توقعات',
  'Toxic manager vibe': 'منفی مینیجر کا تاثر',
  'Delay in process': 'عمل میں تاخیر',
  'Low transparency': 'کم شفافیت',

  // Benefits
  'Health insurance': 'ہیلتھ انشورنس',
  'Life insurance': 'لائف انشورنس',
  'Provident fund': 'پروویڈنٹ فنڈ',
  'Annual leave': 'سالانہ چھٹی',
  'Sick leave': 'بیماری کی چھٹی',
  'Parental leave': 'والدین کی چھٹی',
  'Learning budget': 'سیکھنے کا بجٹ',
  'Device support': 'ڈیوائس سپورٹ',
  'Meal support': 'کھانے کی سہولت',
  'Wellness benefits': 'صحت و تندرستی کی مراعات',

  // Satisfaction anchors
  'Very dissatisfied': 'بہت غیر مطمئن',
  'Very satisfied': 'بہت مطمئن',
  'Poor fit': 'ناموزوں',
  'Great fit': 'بہت موزوں',
  'Not aligned': 'ہم آہنگ نہیں',
  'Strongly aligned': 'مکمل ہم آہنگ',
  'No sense of purpose': 'مقصد کا احساس نہیں',
  'Strong sense of purpose': 'مقصد کا مضبوط احساس',
  'Not important': 'اہم نہیں',
  'Very important': 'بہت اہم',

  // ------------------------------------------------------------- labels ----
  'Career stage': 'کیریئر کا مرحلہ',
  'Career switcher': 'کیریئر تبدیل کرنے والے',
  'Target functional domain': 'ہدف شعبہ',
  'Current country': 'موجودہ ملک',
  // 'Current city' is deliberately absent here — it is already defined above as
  // a preferred-work-location option value. Keying by English string means one
  // entry serves both uses; a second would be a duplicate key. If a collision
  // ever needs DIFFERENT wording per context, disambiguate at the call site
  // rather than adding a second key here.
  'Preferred work arrangement': 'ترجیحی طرزِ کار',
  'Preferred work location': 'ترجیحی مقامِ کار',
  'Preferred country': 'ترجیحی ملک',
  'Willing to relocate': 'منتقل ہونے کے لیے تیار',
  'Employment status': 'ملازمت کی حیثیت',
  'Current employer': 'موجودہ آجر',
  'Current job title': 'موجودہ عہدہ',
  'Employment type': 'ملازمت کی قسم',
  'Current base salary': 'موجودہ بنیادی تنخواہ',
  Currency: 'کرنسی',
  'Pay frequency': 'ادائیگی کا وقفہ',
  'Current benefits': 'موجودہ مراعات',
  'Current work arrangement': 'موجودہ طرزِ کار',
  'Working hours per week': 'ہفتہ وار کام کے گھنٹے',
  'Average daily commute': 'اوسط روزانہ سفر',
  'Overall job satisfaction': 'مجموعی ملازمت کا اطمینان',
  'Career growth satisfaction': 'کیریئر ترقی کا اطمینان',
  'Work-life balance satisfaction': 'کام اور زندگی کے توازن کا اطمینان',

  'Number of offers': 'آفرز کی تعداد',
  'What are you evaluating?': 'آپ کس چیز کا جائزہ لے رہے ہیں؟',
  'What matters most to you?': 'آپ کے لیے سب سے اہم کیا ہے؟',

  'Manager impression': 'مینیجر کا تاثر',
  'Team culture fit': 'ٹیم کلچر سے ہم آہنگی',
  'Red flags from interviews': 'انٹرویو سے خطرے کی علامات',
  'Your private notes': 'آپ کے ذاتی نوٹس',
  'Values alignment': 'اقدار کی ہم آہنگی',
  'Inclusion confidence': 'شمولیت پر اعتماد',
  'Work pressure': 'کام کا دباؤ',
  'Company reputation': 'کمپنی کی ساکھ',
  'Leadership stability': 'قیادت کا استحکام',
  'How the company treats employees': 'کمپنی ملازمین کے ساتھ کیسا سلوک کرتی ہے',
  'Leadership style': 'قیادت کا انداز',
  'Psychological safety': 'نفسیاتی تحفظ',
  'Sense of purpose': 'مقصد کا احساس',
  'Culture importance': 'کلچر کی اہمیت',

  // ------------------------------------------------- conditional pills ----
  // The amber tag naming why a field is inactive. Verbatim FRS phrasing in
  // English, so the keys read oddly out of context but match exactly.
  'if career switcher': 'اگر کیریئر تبدیل کر رہے ہیں',
  'if not Remote': 'اگر ریموٹ نہیں',
  'if Contract / Temporary': 'اگر معاہدہ / عارضی',
  'if offer country ≠ current country': 'اگر آفر کا ملک موجودہ ملک سے مختلف ہو',
  'if Specific country': 'اگر مخصوص ملک',
  'if Specific city': 'اگر مخصوص شہر',
  'if specific city': 'اگر مخصوص شہر',
  'if specific country or city': 'اگر مخصوص ملک یا شہر',
  'if Other': 'اگر دیگر',

  // -------------------------------------------------------- placeholders ---
  'Select a country': 'ملک منتخب کریں',
  'Select a country first': 'پہلے ملک منتخب کریں',
  'Select a city': 'شہر منتخب کریں',
  'Select a currency': 'کرنسی منتخب کریں',
  'Select a domain': 'شعبہ منتخب کریں',
  'Select a preference': 'ترجیح منتخب کریں',
  'Company name': 'کمپنی کا نام',
  'Job title': 'عہدے کا نام',
  'Enter amount': 'رقم درج کریں',
  'Please specify': 'وضاحت کریں',
  'Specify preferred work location': 'ترجیحی مقامِ کار بتائیں',
  'e.g. Lahore': 'مثلاً لاہور',
  Use: 'استعمال کریں',

  // ------------------------------------------------------------- units ----
  // Shown inside numeric fields. Kept short — they sit in a fixed-width slot.
  'hrs / week': 'گھنٹے / ہفتہ',
  'min / day': 'منٹ / دن',
  days: 'دن',
  '%': '%',

  // ----------------------------------------------------------- sections ----
  // Sub-section names (Professional information, Location information, …) are
  // already defined below alongside the section titles — they were rendering in
  // English because FieldSubSection was not calling t(), not because they were
  // missing here.
  'Sharing & privacy': 'اشتراک اور رازداری',
  'Personal Career Profile': 'ذاتی کیریئر پروفائل',
  'Current employment': 'موجودہ ملازمت',
  'Professional information': 'پیشہ ورانہ معلومات',
  'Location information': 'مقام کی معلومات',
  'Location & work preferences': 'مقام اور کام کی ترجیحات',
  'Employment information': 'ملازمت کی معلومات',
  Compensation: 'معاوضہ',
  'Working conditions': 'کام کے حالات',
  'Career satisfaction': 'کیریئر کا اطمینان',
  'Manager & team': 'مینیجر اور ٹیم',
  'Company culture': 'کمپنی کا کلچر',
  'Your offers': 'آپ کی آفرز',
  'Market intelligence': 'مارکیٹ کی معلومات',
  'Offer fit score': 'آفر موزونیت اسکور',
  'How this offer scores across categories': 'یہ آفر مختلف زمروں میں کیسے اسکور کرتی ہے',
  'Strengths & watch-outs': 'خوبیاں اور خیال رکھنے کی باتیں',
  'Suggested next steps': 'تجویز کردہ اگلے اقدامات',
  'Community insight': 'کمیونٹی کی بصیرت',

  // ------------------------------------------------------------ buttons ----
  Back: 'واپس',
  Next: 'آگے',
  Finish: 'مکمل کریں',
  Skip: 'چھوڑ دیں',
  'Download summary': 'خلاصہ ڈاؤن لوڈ کریں',
  'Preparing PDF…': 'پی ڈی ایف تیار ہو رہی ہے…',
  '+ Add another offer': '+ ایک اور آفر شامل کریں',
  'Revisit answers': 'جوابات دوبارہ دیکھیں',
  'Select…': 'منتخب کریں…',
  'Loading…': 'لوڈ ہو رہا ہے…',
  // 'Select a country first' lives in the placeholders block above.
  'Select or type a city': 'شہر منتخب کریں یا لکھیں',
  'No matches': 'کوئی مماثلت نہیں',
  required: 'لازمی',

  // ----------------------------------------------------- compare/results ---
  'Top match': 'بہترین مماثلت',
  Tie: 'برابر',
  Category: 'زمرہ',
  Winner: 'فاتح',
  'Overall fit': 'مجموعی موزونیت',
  RECOMMENDATION: 'سفارش',
  'Top strengths': 'نمایاں خوبیاں',
  'Watch-outs': 'خیال رکھنے کی باتیں',
  'No categories scored above 75.': 'کسی زمرے کا اسکور 75 سے زیادہ نہیں۔',
  'No major watch-outs identified.': 'کوئی بڑی تشویش کی بات سامنے نہیں آئی۔',
  'Sample data': 'نمونہ ڈیٹا',
  'What you are contributing': 'آپ کیا فراہم کر رہے ہیں',
  'Contribute my anonymised pattern': 'میرا غیر شناختی پیٹرن فراہم کریں',
  'Salary ranges': 'تنخواہ کی حدود',
  'Benefits patterns': 'مراعات کے پیٹرن',
  'Growth signals': 'ترقی کے اشارے',
  'Culture signals': 'کلچر کے اشارے',
  'Acceptance patterns': 'قبولیت کے پیٹرن',
  'Sharing is off, so nothing is contributed to the community.':
    'شیئرنگ بند ہے، اس لیے کمیونٹی کو کچھ فراہم نہیں کیا جا رہا۔',
  'Turn on sharing to choose what you contribute.':
    'یہ منتخب کرنے کے لیے کہ آپ کیا فراہم کرتے ہیں، شیئرنگ آن کریں۔',
  'Saving…': 'محفوظ ہو رہا ہے…',

  // --------------------------------------------------------- disclaimers ---
  'This is decision guidance, not a final decision.':
    'یہ فیصلے میں رہنمائی ہے، حتمی فیصلہ نہیں۔',
  'You choose what fits your life and career. OfferGuide helps you think clearly — the decision is always yours.':
    'آپ خود طے کرتے ہیں کہ آپ کی زندگی اور کیریئر کے لیے کیا موزوں ہے۔ آفر گائیڈ صرف واضح سوچنے میں مدد دیتا ہے — فیصلہ ہمیشہ آپ کا ہے۔',
};
