# Guide content for each language; {key} placeholders take the app's own button labels
TITLES = {
 'ar': dict(help='تعليمات', about='عن التطبيق', login='طريقة الدخول', family='للعائلة', cook='للطباخ', driver='للسائق', admin='للإدارة', tip='تنبيه', ok='فهمت'),
 'en': dict(help='Help', about='About the app', login='How to log in', family='For the family', cook='For the cook', driver='For the driver', admin='For the manager', tip='Note', ok='Got it'),
 'hi': dict(help='मदद', about='ऐप के बारे में', login='कैसे प्रवेश करें', family='परिवार के लिए', cook='रसोइए के लिए', driver='ड्राइवर के लिए', admin='प्रबंधक के लिए', tip='ध्यान दें', ok='समझ गया'),
 'bn': dict(help='সাহায্য', about='অ্যাপ সম্পর্কে', login='কীভাবে প্রবেশ করবেন', family='পরিবারের জন্য', cook='রাঁধুনির জন্য', driver='ড্রাইভারের জন্য', admin='ম্যানেজারের জন্য', tip='লক্ষ্য করুন', ok='বুঝেছি'),
 'fil': dict(help='Tulong', about='Tungkol sa app', login='Paano pumasok', family='Para sa pamilya', cook='Para sa kusinero', driver='Para sa drayber', admin='Para sa tagapamahala', tip='Paalala', ok='Sige'),
}
G = {
'ar': dict(
 intro='غداء البيت تطبيق بسيط ينظّم غداء البيت: منيو يومي جاهز، ونواقص المطبخ تصل للسائق، وأسعار المشتريات مسجّلة.',
 login=['افتح الرابط: ghada-albait.github.io','اختر لغتك','اكتب رمز البيت ورمزك الشخصي، ثم اضغط «{enter}»','أضف التطبيق للشاشة الرئيسية من قائمة المتصفح'],
 family=['ترى غداء اليوم والغد والأيام القادمة','اضغط 💬 لتقترح طبقاً أو ترسل رسالة للإدارة','يظهر لك الرد وحالة طلبك في نفس المكان'],
 cook=['افتح تبويب «{tabToday}» لترى غداء اليوم وملاحظات العائلة','بعد ما تقرأ المنيو اضغط «{gotIt}»','إذا نقص شيء: تبويب «{tabList}» ثم «{addMissing}» واختر السلعة والكمية','تبويب «{tabWeek}» يعرض غداء الغد للتحضير','إذا ظهر زر «{photoAsk}» صوّر الطبق عند التقديم','اضغط 💬 لترسل رسالة للإدارة'],
 driver=['ترى قائمة الأشياء المطلوب شراؤها','بعد الشراء اضغط «{markBought}» واكتب الكمية والسعر الإجمالي والمكان، ثم احفظ','اشتريت شيئاً غير موجود في القائمة؟ اضغط «{extraPurchase}»','زر «{share}» يرسل القائمة على واتساب','اضغط 💬 لترسل رسالة للإدارة'],
 admin=['المنيو: يتجهز تلقائياً لأسبوعين. اضغط أي يوم لتعديله أو لإضافة ملاحظة للطباخ','الطلبات: اقتراحات ورسائل العائلة والعمالة، وتضيف الطبق المقترح للمنيو بلمسة','النواقص: كل ما طلبه الطباخ، وتقدر تسجّل شراء بنفسك','التقارير: مصروف الشهر، وأسعار كل سلعة، وتنبيه عند ارتفاع السعر','المكتبة: الأطباق والسلع، والصور التي صوّرها الطباخ بانتظار اعتمادك','الإعدادات: رموز الدخول والدعوات، والأجهزة الداخلة، وتركيبة الغداء اليومي'],
 tip='لا تعطِ رمزك لأحد. إذا نسيته اطلبه من صاحب البيت.'),
'en': dict(
 intro='Home Lunch is a simple app for the house lunch: a ready daily menu, kitchen shortages sent to the driver, and purchase prices recorded.',
 login=['Open the link: ghada-albait.github.io','Choose your language','Type the house code and your PIN, then tap “{enter}”','Add the app to your home screen from the browser menu'],
 family=["See today's lunch, tomorrow's and the coming days",'Tap 💬 to suggest a dish or send a message to the manager','You will see the reply and the status of your request there'],
 cook=["Open the “{tabToday}” tab to see today's lunch and the family's notes",'After reading the menu, tap “{gotIt}”','If something is missing: “{tabList}” tab, then “{addMissing}”, and choose the item and quantity',"The “{tabWeek}” tab shows tomorrow's lunch so you can prepare",'If you see “{photoAsk}”, take a photo when you serve the dish','Tap 💬 to send a message to the manager'],
 driver=['See the list of things to buy','After buying, tap “{markBought}”, enter the quantity, total price and store, then save','Bought something not on the list? Tap “{extraPurchase}”','The “{share}” button sends the list on WhatsApp','Tap 💬 to send a message to the manager'],
 tip='Do not share your PIN. If you forget it, ask the home owner.'),
'hi': dict(
 intro='घर का खाना एक आसान ऐप है: रोज़ का मेन्यू तैयार, रसोई में कम पड़ी चीज़ें ड्राइवर तक पहुंचती हैं, और खरीद की कीमतें दर्ज होती हैं।',
 login=['लिंक खोलें: ghada-albait.github.io','अपनी भाषा चुनें','घर का कोड और अपना पिन डालें, फिर “{enter}” दबाएं','ब्राउज़र मेन्यू से ऐप को होम स्क्रीन पर जोड़ें'],
 family=['आज, कल और आने वाले दिनों का खाना देखें','डिश सुझाने या प्रबंधक को संदेश भेजने के लिए 💬 दबाएं','जवाब और आपके अनुरोध की स्थिति वहीं दिखेगी'],
 cook=['“{tabToday}” टैब में आज का खाना और परिवार के नोट देखें','मेन्यू पढ़ने के बाद “{gotIt}” दबाएं','कुछ कम हो तो: “{tabList}” टैब, फिर “{addMissing}”, और सामान व मात्रा चुनें','“{tabWeek}” टैब में तैयारी के लिए कल का खाना दिखता है','अगर “{photoAsk}” दिखे, तो परोसते समय डिश की फ़ोटो लें','प्रबंधक को संदेश भेजने के लिए 💬 दबाएं'],
 driver=['खरीदने वाली चीज़ों की सूची देखें','खरीदने के बाद “{markBought}” दबाएं, मात्रा, कुल कीमत और दुकान लिखें, फिर सेव करें','सूची से बाहर कुछ खरीदा? “{extraPurchase}” दबाएं','“{share}” बटन से सूची WhatsApp पर भेजें','प्रबंधक को संदेश भेजने के लिए 💬 दबाएं'],
 tip='अपना पिन किसी को न बताएं। भूल जाएं तो घर के मालिक से पूछें।'),
'bn': dict(
 intro='বাড়ির খাবার একটি সহজ অ্যাপ: প্রতিদিনের মেনু তৈরি থাকে, রান্নাঘরে যা লাগবে তা ড্রাইভারের কাছে যায়, আর কেনাকাটার দাম লেখা থাকে।',
 login=['লিংকটি খুলুন: ghada-albait.github.io','আপনার ভাষা বেছে নিন','বাড়ির কোড ও আপনার পিন লিখে “{enter}” চাপুন','ব্রাউজারের মেনু থেকে অ্যাপটি হোম স্ক্রিনে যোগ করুন'],
 family=['আজ, আগামীকাল ও সামনের দিনগুলোর খাবার দেখুন','খাবার প্রস্তাব করতে বা ম্যানেজারকে বার্তা পাঠাতে 💬 চাপুন','উত্তর ও আপনার অনুরোধের অবস্থা সেখানেই দেখবেন'],
 cook=['“{tabToday}” ট্যাবে আজকের খাবার ও পরিবারের নোট দেখুন','মেনু পড়ার পর “{gotIt}” চাপুন','কিছু না থাকলে: “{tabList}” ট্যাব, তারপর “{addMissing}”, এবং জিনিস ও পরিমাণ বেছে নিন','“{tabWeek}” ট্যাবে প্রস্তুতির জন্য আগামীকালের খাবার দেখায়','“{photoAsk}” দেখালে, পরিবেশনের সময় খাবারের ছবি তুলুন','ম্যানেজারকে বার্তা পাঠাতে 💬 চাপুন'],
 driver=['কী কী কিনতে হবে তার তালিকা দেখুন','কেনার পর “{markBought}” চাপুন, পরিমাণ, মোট দাম ও দোকান লিখে সেভ করুন','তালিকার বাইরে কিছু কিনেছেন? “{extraPurchase}” চাপুন','“{share}” বোতাম দিয়ে তালিকা WhatsApp-এ পাঠান','ম্যানেজারকে বার্তা পাঠাতে 💬 চাপুন'],
 tip='আপনার পিন কাউকে বলবেন না। ভুলে গেলে বাড়ির মালিককে জিজ্ঞেস করুন।'),
'fil': dict(
 intro='Ang Tanghalian sa Bahay ay simpleng app: handa ang menu araw-araw, ang kulang sa kusina ay napupunta sa drayber, at nakatala ang presyo ng mga binili.',
 login=['Buksan ang link: ghada-albait.github.io','Piliin ang iyong wika','Ilagay ang code ng bahay at ang iyong PIN, saka pindutin ang “{enter}”','Idagdag ang app sa home screen mula sa menu ng browser'],
 family=['Tingnan ang tanghalian ngayon, bukas at sa mga susunod na araw','Pindutin ang 💬 para magmungkahi ng ulam o magpadala ng mensahe sa tagapamahala','Makikita mo roon ang sagot at ang estado ng iyong kahilingan'],
 cook=['Buksan ang tab na “{tabToday}” para makita ang tanghalian ngayon at ang paalala ng pamilya','Pagkabasa ng menu, pindutin ang “{gotIt}”','Kung may kulang: tab na “{tabList}”, saka “{addMissing}”, at piliin ang item at dami','Ang tab na “{tabWeek}” ay nagpapakita ng tanghalian bukas para makapaghanda','Kung makita ang “{photoAsk}”, kunan ng litrato ang ulam kapag inihain','Pindutin ang 💬 para magpadala ng mensahe sa tagapamahala'],
 driver=['Tingnan ang listahan ng bibilhin','Pagkabili, pindutin ang “{markBought}”, ilagay ang dami, kabuuang presyo at tindahan, saka i-save','May binili na wala sa listahan? Pindutin ang “{extraPurchase}”','Ang button na “{share}” ay nagpapadala ng listahan sa WhatsApp','Pindutin ang 💬 para magpadala ng mensahe sa tagapamahala'],
 tip='Huwag ibahagi ang iyong PIN. Kung makalimutan, magtanong sa may-ari ng bahay.'),
}
import json,re
def labels():
    s=open('/home/claude/ghada-albait.github.io/js/i18n.js').read()
    return json.loads(re.search(r'export const I18N = (\{.*?\});\nexport const QUICK',s,re.S).group(1))
def filled():
    T=labels(); out={}
    for l,g in G.items():
        lab={k:v.replace(' ✓','') for k,v in T[l].items()}
        f=lambda x: x.format(**lab)
        out[l]={k:(f(v) if isinstance(v,str) else [f(i) for i in v]) for k,v in g.items()}
        out[l]['t']=TITLES[l]
    return out
