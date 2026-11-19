// "What's new" notes, shown once to each person after an update (newest first).
// Each entry: v = app version, then per role a list of lines per language (missing language falls back to en, then ar).
export const CHANGES = [
{
v: 21, date: '2026-11-19',
admin: {
ar: [
'🔔 التنبيهات: فعّلها من بطاقة «تفعيل التنبيهات» أو من زر 👤. يصلك تنبيه بكل رسالة أو اقتراح جديد.',
'✉️ رسائل منك: من «الطلبات» ← «رسالة جديدة» أرسل للطباخ أو السائق أو العائلة، كتابة أو 🎙️ صوت حتى دقيقة.',
'💬 اضغط أي رسالة لتفتحها كاملة مع الترجمة والرد بالصوت أو الكتابة.',
'⭐ التقييم: قيّم غداء اليوم تحت المنيو. وفي «التقارير» ترى المتوسط والأطباق الأكثر والأقل إعجاباً وتعليقات العائلة مع زر «أرسل للطباخ».',
'📤 واتساب: زر المشاركة أعلى الشاشة يرسل المنيو أو قائمة المشتريات أو طريقة طبق بأي لغة.',
'📖 طريقة التحضير: أضفها لأي طبق من «المزيد ← المكتبة»، وتظهر للطباخ مع زر ترجمة.',
'🛒 السائق صار يضيف للنواقص بنفسه، وأُضيفت لوازم منزلية للقائمة.',
'⏰ «المزيد ← الإعدادات»: وقت وصول منيو بكرة للطباخ (7 مساءً) والتذكير الصباحي.',
'🌙 من زر 👤: الوضع الداكن وقفل Face ID أو البصمة.'
]
},
family: {
ar: [
'🔔 فعّل التنبيهات: اضغط بطاقة «تفعيل التنبيهات» ثم «سماح». في الآيفون افتح التطبيق من أيقونته في الشاشة الرئيسية.',
'⭐ قيّم غداء اليوم تحت المنيو: نجوم، و👍 أو 👎 لكل طبق، وتعليق يصل للإدارة فقط.',
'💬 الرسائل: اقترح طبقاً أو أرسل رسالة للإدارة، ويمكنك تسجيل 🎙️ رسالة صوتية حتى دقيقة. يصلك تنبيه عند الرد.',
'🌙 من زر 👤: الوضع الداكن وقفل Face ID أو البصمة.'
],
en: [
'🔔 Turn on notifications: tap the “Turn on notifications” card, then “Allow”. On iPhone, open the app from its Home Screen icon.',
'⭐ Rate today’s lunch under the menu: stars, 👍 or 👎 for each dish, and a comment only the manager sees.',
'💬 Messages: suggest a dish or message the manager, or record a 🎙️ voice message (up to 1 minute). You get a notification when they reply.',
'🌙 From the 👤 button: dark mode and Face ID / fingerprint lock.'
]
},
cook: {
ar: [
'🔔 فعّل التنبيهات: اضغط «تفعيل التنبيهات» ثم «سماح». في الآيفون افتح التطبيق من أيقونته.',
'🍽️ يصلك منيو بكرة في المساء، وتذكير في الصباح، وتنبيه إذا تغيّر المنيو.',
'⭐ ترى تقييم العائلة لغداء اليوم وأمس تحت المنيو.',
'📖 زر «طريقة التحضير» تحت بعض الأطباق، مع زر ترجمة.',
'💬 الرسائل: اكتب أو سجّل 🎙️ صوتاً للإدارة. رسائل الإدارة تظهر في 💬 مع زر ترجمة.'
],
en: [
'🔔 Turn on notifications: tap “Turn on notifications”, then “Allow”. On iPhone, open the app from its Home Screen icon.',
'🍽️ You get tomorrow’s menu in the evening, a reminder in the morning, and an alert if the menu changes.',
'⭐ See the family’s rating of today’s and yesterday’s lunch under the menu.',
'📖 A “How to cook” button appears under some dishes, with a translate link.',
'💬 Messages: write or record a 🎙️ voice message to the manager. Manager messages appear in 💬 with a translate link.'
],
hi: [
'🔔 सूचनाएं चालू करें: “सूचनाएं चालू करें” दबाएं, फिर “Allow”। iPhone पर ऐप को होम स्क्रीन के आइकन से खोलें।',
'🍽️ कल का मेनू शाम को आएगा, सुबह याद दिलाया जाएगा, और मेनू बदलने पर सूचना आएगी।',
'⭐ मेनू के नीचे आज और कल के खाने की परिवार की रेटिंग दिखेगी।',
'📖 कुछ व्यंजनों के नीचे “बनाने का तरीका” बटन है, अनुवाद के साथ।',
'💬 संदेश: प्रबंधक को लिखें या 🎙️ आवाज़ रिकॉर्ड करें। प्रबंधक के संदेश 💬 में अनुवाद के साथ दिखेंगे।'
],
bn: [
'🔔 নোটিফিকেশন চালু করুন: “নোটিফিকেশন চালু করুন” চাপুন, তারপর “Allow”। iPhone-এ হোম স্ক্রিনের আইকন থেকে অ্যাপ খুলুন।',
'🍽️ আগামীকালের মেনু সন্ধ্যায় আসবে, সকালে মনে করিয়ে দেবে, আর মেনু বদলালে নোটিফিকেশন আসবে।',
'⭐ মেনুর নিচে আজ ও গতকালের খাবারের পরিবারের রেটিং দেখবেন।',
'📖 কিছু পদের নিচে “রান্নার নিয়ম” বোতাম আছে, অনুবাদসহ।',
'💬 বার্তা: ম্যানেজারকে লিখুন বা 🎙️ ভয়েস রেকর্ড করুন। ম্যানেজারের বার্তা 💬-এ অনুবাদসহ দেখাবে।'
],
te: [
'🔔 నోటిఫికేషన్లు ఆన్ చేయండి: “నోటిఫికేషన్లు ఆన్ చేయండి” నొక్కి, “Allow” నొక్కండి. iPhone లో హోమ్ స్క్రీన్ ఐకాన్ నుండి యాప్ తెరవండి.',
'🍽️ రేపటి మెనూ సాయంత్రం వస్తుంది, ఉదయం గుర్తు చేస్తుంది, మెనూ మారితే నోటిఫికేషన్ వస్తుంది.',
'⭐ మెనూ కింద ఈరోజు మరియు నిన్నటి భోజనానికి కుటుంబం ఇచ్చిన రేటింగ్ కనిపిస్తుంది.',
'📖 కొన్ని వంటకాల కింద “వండే విధానం” బటన్ ఉంది, అనువాదంతో.',
'💬 సందేశాలు: మేనేజర్‌కు రాయండి లేదా 🎙️ వాయిస్ రికార్డ్ చేయండి. మేనేజర్ సందేశాలు 💬 లో అనువాదంతో కనిపిస్తాయి.'
],
fil: [
'🔔 I-on ang notifications: pindutin ang “I-on ang notifications”, saka “Allow”. Sa iPhone, buksan ang app mula sa icon sa Home Screen.',
'🍽️ Darating ang menu bukas sa gabi, may paalala sa umaga, at may alerto kapag nagbago ang menu.',
'⭐ Makikita sa ilalim ng menu ang rating ng pamilya sa tanghalian ngayon at kahapon.',
'📖 May button na “Paano lutuin” sa ilalim ng ilang ulam, may link para isalin.',
'💬 Mensahe: sumulat o mag-record ng 🎙️ boses para sa tagapamahala. Lalabas sa 💬 ang mensahe ng tagapamahala na may link para isalin.'
]
},
driver: {
ar: [
'🔔 فعّل التنبيهات: اضغط «تفعيل التنبيهات» ثم «سماح». يصلك تنبيه عند إضافة أغراض جديدة للشراء.',
'🛒 صرت تضيف للقائمة بنفسك: زر «+ أضف ناقص»، ومنها لوازم البيت (مناديل، صابون، غاز…).',
'💬 الرسائل: اكتب أو سجّل 🎙️ صوتاً للإدارة. رسائل الإدارة تظهر في 💬 مع زر ترجمة.'
],
en: [
'🔔 Turn on notifications: tap “Turn on notifications”, then “Allow”. You get an alert when new items are added to buy.',
'🛒 You can now add to the list yourself: “+ Add missing item”, including household supplies (tissues, soap, gas…).',
'💬 Messages: write or record a 🎙️ voice message to the manager. Manager messages appear in 💬 with a translate link.'
],
hi: [
'🔔 सूचनाएं चालू करें: “सूचनाएं चालू करें” दबाएं, फिर “Allow”। नई चीज़ें खरीदने के लिए जुड़ने पर सूचना आएगी।',
'🛒 अब आप खुद सूची में जोड़ सकते हैं: “+ कमी वाला सामान जोड़ें”, घर का सामान भी (टिशू, साबुन, गैस…)।',
'💬 संदेश: प्रबंधक को लिखें या 🎙️ आवाज़ रिकॉर्ड करें। प्रबंधक के संदेश 💬 में अनुवाद के साथ दिखेंगे।'
],
bn: [
'🔔 নোটিফিকেশন চালু করুন: “নোটিফিকেশন চালু করুন” চাপুন, তারপর “Allow”। নতুন কেনার জিনিস যোগ হলে নোটিফিকেশন আসবে।',
'🛒 এখন আপনি নিজেই তালিকায় যোগ করতে পারবেন: “+ যা নেই তা যোগ করুন”, বাড়ির জিনিসও (টিস্যু, সাবান, গ্যাস…)।',
'💬 বার্তা: ম্যানেজারকে লিখুন বা 🎙️ ভয়েস রেকর্ড করুন। ম্যানেজারের বার্তা 💬-এ অনুবাদসহ দেখাবে।'
],
te: [
'🔔 నోటిఫికేషన్లు ఆన్ చేయండి: “నోటిఫికేషన్లు ఆన్ చేయండి” నొక్కి, “Allow” నొక్కండి. కొనవలసిన కొత్త వస్తువులు జోడించినప్పుడు నోటిఫికేషన్ వస్తుంది.',
'🛒 ఇప్పుడు మీరే జాబితాలో జోడించవచ్చు: “+ లేని వస్తువు జోడించండి”, ఇంటి సామాన్లు కూడా (టిష్యూ, సబ్బు, గ్యాస్…).',
'💬 సందేశాలు: మేనేజర్‌కు రాయండి లేదా 🎙️ వాయిస్ రికార్డ్ చేయండి. మేనేజర్ సందేశాలు 💬 లో అనువాదంతో కనిపిస్తాయి.'
],
fil: [
'🔔 I-on ang notifications: pindutin ang “I-on ang notifications”, saka “Allow”. May alerto kapag may bagong bibilhin.',
'🛒 Puwede ka nang magdagdag sa listahan: “+ Idagdag ang kulang”, pati gamit sa bahay (tissue, sabon, gas…).',
'💬 Mensahe: sumulat o mag-record ng 🎙️ boses para sa tagapamahala. Lalabas sa 💬 ang mensahe ng tagapamahala na may link para isalin.'
]
}
}
];
