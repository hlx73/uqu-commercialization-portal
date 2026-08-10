import os
import json
import random
from datetime import datetime, timedelta

def generate_seed_data():
    # Base templates
    projects_templates = [
        {
            "title_en": "Computer Vision for Real-Time Crowd Density Estimation in the Mataf",
            "title_ar": "رؤية الحاسوب للتقدير الفوري لكثافة الحشود في المطاف",
            "abstract_en": "This project develops a deep learning-based system using existing CCTV feeds to estimate crowd density in the Mataf area of the Grand Mosque. It predicts bottleneck zones and suggests dynamic route re-allocations to prevent crushing incidents.",
            "abstract_ar": "يطور هذا المشروع نظاماً يعتمد على التعلم العميق باستخدام كاميرات المراقبة الحالية لتقدير كثافة الحشود في منطقة المطاف بالمسجد الحرام. ويتنبأ بمناطق الازدحام ويقترح إعادة توجيه المسارات ديناميكياً لتفادي التدافع.",
            "sector": "Hajj & Umrah Tech",
            "department": "Computer Science",
            "type": "Paper",
            "base_trl": 5,
            "commercial_apps_en": [
                "Dynamic crowd control dashboard for security services",
                "Integrations with official pilgrim guidance apps (e.g., Nusuk)",
                "Evacuation planning simulation software for stadiums and major events"
            ],
            "commercial_apps_ar": [
                "لوحة تحكم ديناميكية للتحكم في الحشود للجهات الأمنية",
                "التكامل مع التطبيقات الرسمية لإرشاد الحجاج (مثل نسك)",
                "برمجيات محاكاة خطط الإخلاء للاستادات والفعاليات الكبرى"
            ],
            "customers_en": ["Ministry of Hajj and Umrah", "Royal Commission for Makkah City", "General Presidency for the Grand Mosque"],
            "customers_ar": ["وزارة الحج والعمرة", "الهيئة الملكية لمدينة مكة المكرمة والمشاعر المقدسة", "الهيئة العامة للعناية بشؤون المسجد الحرام والمسجد النبوي"],
            "startups": ["Selsela Crowd Management (سلسلة لإدارة الحشود)", "Falcon AI Systems (فالكون للذكاء الاصطناعي)"]
        },
        {
            "title_en": "Smart IoT-Enabled Wristband for Real-time Pilgrim Health and Location Tracking",
            "title_ar": "سوار ذكي متصل بإنترنت الأشياء لتتبع الحالة الصحية والموقع الجغرافي للحجاج",
            "abstract_en": "A wearable IoT device equipped with temperature, heart rate, and GPS sensors. It transmits vital health data of high-risk pilgrims to central medical hubs during Hajj and alerts camp operators in case of cardiac arrest or wandering.",
            "abstract_ar": "جهاز ذكي قابل للارتداء مجهز بمستشعرات لدرجة الحرارة ومعدل ضربات القلب ونظام تحديد المواقع GPS. يقوم بنقل البيانات الصحية الحيوية للحجاج الأكثر عرضة للمخاطر إلى المراكز الطبية المركزية خلال موسم الحج وتنبيه مشغلي المخيمات في حالات الطوارئ.",
            "sector": "HealthTech & Biotech",
            "department": "Electrical Engineering",
            "type": "Patent",
            "base_trl": 6,
            "commercial_apps_en": [
                "B2B health tracking subscription for Hajj tour operators",
                "Integration platform for Saudi Red Crescent emergency services",
                "Wearable device manufacturing for remote patient monitoring in deserts"
            ],
            "commercial_apps_ar": [
                "اشتراك تتبع صحي للشركات السياحية وحملات الحج",
                "منصة تكاملية لخدمات طوارئ الهلال الأحمر السعودي",
                "تصنيع الأجهزة القابلة للارتداء لمراقبة المرضى عن بعد في البيئات الصحراوية"
            ],
            "customers_en": ["Saudi Red Crescent Authority", "Ministry of Health", "Hajj Pilgrimage Companies"],
            "customers_ar": ["هيئة الهلال الأحمر السعودي", "وزارة الصحة", "شركات ومؤسسات حجاج بيت الله الحرام"],
            "startups": ["HajjGuider (دليل الحج)", "Nala Health (نالا للرعاية الصحية)"]
        },
        {
            "title_en": "Autonomous Waste Sorting and Compacting Robot for Holy Sites",
            "title_ar": "روبوت ذاتي القيادة لفرز وكبس النفايات في المشاعر المقدسة",
            "abstract_en": "An autonomous mobile robot (AMR) designed for outdoor holy sites like Mina. It uses computer vision to identify and sort plastic bottles, organic waste, and aluminum cans, compacting them internally to maximize collection capacity.",
            "abstract_ar": "روبوت متنقل مستقل (AMR) مصمم للمشاعر المقدسة الخارجية مثل مشعر منى. يستخدم رؤية الحاسوب للتعرف على الزجاجات البلاستيكية والنفايات العضوية وعلب الألومنيوم وفرزها، مع كبسها داخلياً لزيادة سعة التجميع.",
            "sector": "Clean Energy & Environment",
            "department": "Mechanical Engineering",
            "type": "Graduation Project",
            "base_trl": 4,
            "commercial_apps_en": [
                "Autonomous sweeping fleets for municipalities",
                "Smart recycling kiosks for public parks and airports",
                "Industrial waste sorters for recycling centers"
            ],
            "commercial_apps_ar": [
                "أساطيل الكنس الذاتي للبلديات والأمانات",
                "أكشاك إعادة التدوير الذكية للمتنزهات العامة والمطارات",
                "أجهزة فرز النفايات الصناعية لمراكز إعادة التدوير"
            ],
            "customers_en": ["Makkah Municipality", "National Center for Waste Management (MWAN)", "KIDANA Development Company"],
            "customers_ar": ["أمانة العاصمة المقدسة", "المركز الوطني لإدارة النفايات (موان)", "شركة كدانة للتنمية والتطوير"],
            "startups": ["Edama Organic Solutions (إدامة للحلول العضوية)", "Falcon AI Systems (فالكون للذكاء الاصطناعي)"]
        },
        {
            "title_en": "Heat-Reflective Nano-Coating for Mina Pilgrim Tents",
            "title_ar": "طلاء نانوي عاكس للحرارة لخيام الحجاج في منى",
            "abstract_en": "Development of a highly durable nano-particle composite paint that can be applied to Mina tent materials. It reflects up to 94% of solar radiation, reducing the interior temperature by 6-8 degrees Celsius and lowering cooling energy demands.",
            "abstract_ar": "تطوير طلاء مركب من الجسيمات النانوية عالي المتانة يمكن تطبيقه على مواد خيام منى. يعكس ما يصل إلى 94% من الإشعاع الشمسي، مما يقلل درجة الحرارة الداخلية بمقدار 6-8 درجات مئوية ويخفض استهلاك طاقة التكييف.",
            "sector": "Smart Infrastructure & IoT",
            "department": "Applied Chemistry",
            "type": "Patent",
            "base_trl": 7,
            "commercial_apps_en": [
                "Thermal coating for temporary housing and military camps",
                "Energy-efficient roof coatings for residential buildings in hot zones",
                "Protective industrial paints for outdoor warehouses"
            ],
            "commercial_apps_ar": [
                "الطلاء الحراري للإسكان المؤقت والمعسكرات العسكرية",
                "طلاءات الأسطح الموفرة للطاقة للمباني السكنية في المناطق الحارة",
                "دهانات صناعية واقية للمستودعات الخارجية"
            ],
            "customers_en": ["KIDANA Development Company", "Ministry of Housing", "Aramco Operations"],
            "customers_ar": ["شركة كدانة للتنمية والتطوير", "وزارة الشؤون البلدية والقروية والإسكان", "أرامكو السعودية"],
            "startups": ["RedSea Farms (مزارع البحر الأحمر)", "Edama Organic Solutions (إدامة للحلول العضوية)"]
        },
        {
            "title_en": "AI-Based Early Screening of Diabetic Retinopathy in Saudi Patients",
            "title_ar": "الفحص المبكر القائم على الذكاء الاصطناعي لاعتلال الشبكية السكري لدى المرضى السعوديين",
            "abstract_en": "This project creates an AI diagnostic tool trained on local fundus images to screen for diabetic retinopathy. It operates at high accuracy, allowing primary care physicians in local clinics to detect the disease without requiring an ophthalmologist.",
            "abstract_ar": "يصمم هذا المشروع أداة تشخيص بالذكاء الاصطناعي تم تدريبها على صور قاع العين المحلية لفحص اعتلال الشبكية السكري. تعمل بدقة عالية، مما يمكن أطباء الرعاية الأولية في العيادات المحلية من اكتشاف المرض دون الحاجة لطبيب عيون متخصص.",
            "sector": "HealthTech & Biotech",
            "department": "Medicine",
            "type": "Paper",
            "base_trl": 3,
            "commercial_apps_en": [
                "SaaS retinal analysis software integrated into hospital EHRs",
                "Portable retinal camera with embedded AI diagnostics",
                "Automated screening tool for mass health campaigns"
            ],
            "commercial_apps_ar": [
                "برمجيات تحليل الشبكية السحابية المتكاملة مع السجلات الصحية للمستشفيات",
                "كاميرا محمولة لفحص الشبكية مع تشخيص مدمج بالذكاء الاصطناعي",
                "أداة فحص آلية لحملات التوعية والصحة العامة الجماعية"
            ],
            "customers_en": ["Ministry of Health", "King Faisal Specialist Hospital", "Private Hospital Networks"],
            "customers_ar": ["وزارة الصحة", "مستشفى الملك فيصل التخصصي ومركز الأبحاث", "شبكات المستشفيات الخاصة"],
            "startups": ["Nala Health (نالا للرعاية الصحية)"]
        },
        {
            "title_en": "Blockchain-Based Academic Credential Verification System for Saudi Universities",
            "title_ar": "نظام توثيق المؤهلات الأكاديمية القائم على البلوكشين للجامعات السعودية",
            "abstract_en": "A secure decentralized database that issues tamper-proof digital degrees and transcripts for UQU graduates. Employers can instantly verify candidate credentials via cryptographic keys, eliminating fraudulent documents.",
            "abstract_ar": "قاعدة بيانات لامركزية آمنة تصدر شهادات وسجلات دراسية رقمية غير قابلة للتلاعب لخريجي جامعة أم القرى. يمكن لأصحاب العمل التحقق فوراً من مؤهلات المتقدمين عبر مفاتيح تشفير، مما يلغي الشهادات المزورة.",
            "sector": "Islamic Finance & Digital Economy",
            "department": "Information Systems",
            "type": "Graduation Project",
            "base_trl": 5,
            "commercial_apps_en": [
                "Secure credential verification APIs for recruiting portals",
                "Enterprise identity verification software for ministries",
                "SaaS platform for international academic degree equivalence verification"
            ],
            "commercial_apps_ar": [
                "واجهات برمجية لتوثيق المؤهلات لبوابات التوظيف والبحث عن عمل",
                "برمجيات توثيق الهوية والشهادات للمؤسسات والوزارات الحكومية",
                "منصة سحابية لمعادلة الشهادات الأكاديمية الدولية والتحقق منها"
            ],
            "customers_en": ["Ministry of Education", "HRDF (Hadaf)", "SDAIA"],
            "customers_ar": ["وزارة التعليم", "صندوق تنمية الموارد البشرية (هدف)", "الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)"],
            "startups": ["NOMW Ventures (مشاريع نمو)", "Geidea Payment Solutions (جيديا للمدفوعات)"]
        },
        {
            "title_en": "Hybrid Solar-Powered Desalination Device for Small-Scale Desert Farms",
            "title_ar": "جهاز تحلية هجين يعمل بالطاقة الشمسية للمزارع الصحراوية الصغيرة",
            "abstract_en": "Design of a low-maintenance, thermal-vacuum desalination device that operates entirely on solar thermal energy. It purifies high-salinity well water into agricultural-grade water suitable for date palm cultivation.",
            "abstract_ar": "تصميم جهاز تحلية بالتفريغ الحراري قليل الصيانة يعمل بالكامل بالطاقة الحرارية الشمسية. يقوم بتنقية مياه الآبار عالية الملوحة وتحويلها إلى مياه صالحة للزراعة ومناسبة لري أشجار نخيل التمر.",
            "sector": "Clean Energy & Environment",
            "department": "Civil Engineering",
            "type": "Patent",
            "base_trl": 6,
            "commercial_apps_en": [
                "Solar-desalination units for off-grid family farms",
                "Emergency drinking water units for remote desert sites",
                "Water desalination systems for eco-tourism resorts"
            ],
            "commercial_apps_ar": [
                "وحدات تحلية شمسية للمزارع العائلية غير المتصلة بالشبكة الكهربائية",
                "وحدات مياه شرب طارئة للمواقع الصحراوية النائية",
                "أنظمة تحلية مياه للمنتجعات السياحية البيئية"
            ],
            "customers_en": ["Ministry of Environment, Water and Agriculture", "Saudi Agricultural Development Fund", "Red Sea Global"],
            "customers_ar": ["وزارة البيئة والمياه والزراعة", "صندوق التنمية الزراعية السعودي", "شركة البحر الأحمر الدولية"],
            "startups": ["RedSea Farms (مزارع البحر الأحمر)", "Edama Organic Solutions (إدامة للحلول العضوية)"]
        },
        {
            "title_en": "Arabic Legal Smart Contract Generator using Generative NLP",
            "title_ar": "مولد العقود القانونية الذكية باللغة العربية باستخدام البرمجة اللغوية التوليدية",
            "abstract_en": "An NLP model trained on Saudi commercial regulations that automatically draft commercial contracts, leases, and partnership deeds in compliant Arabic. It highlights potential legal risks and outputs directly to blockchain smart contracts.",
            "abstract_ar": "نموذج معالجة لغة طبيعية تم تدريبه على الأنظمة التجارية السعودية لصياغة العقود التجارية والإيجارات وعقود الشراكة باللغة العربية بشكل متوافق نظاماً. يوضح المخاطر القانونية المحتملة ويصدرها مباشرة إلى عقود بلوكشين ذكية.",
            "sector": "Islamic Finance & Digital Economy",
            "department": "Islamic Jurisprudence (Sharia)",
            "type": "Paper",
            "base_trl": 4,
            "commercial_apps_en": [
                "SaaS legal drafting tool for startups and SMEs",
                "Smart contract generator for real estate platforms",
                "Automated compliance checking tools for banks"
            ],
            "commercial_apps_ar": [
                "منصة سحابية للصياغة القانونية للشركات الناشئة والمؤسسات الصغيرة والمتوسطة",
                "مولد عقود ذكية لمنصات العقارات والتمويل العقاري",
                "أدوات تدقيق الامتثال الآلي للبنوك والمؤسسات المالية"
            ],
            "customers_en": ["Ministry of Justice", "Saudi Central Bank (SAMA)", "Real Estate General Authority"],
            "customers_ar": ["وزارة العدل", "البنك المركزي السعودي (ساما)", "الهيئة العامة للعقار"],
            "startups": ["Labiba AI (لبيبة للذكاء الاصطناعي)", "NOMW Ventures (مشاريع نمو)"]
        }
    ]

    names_list = [
        "Dr. Ahmed Al-Ghamdi", "Dr. Khalid Alzahrani", "Prof. Fatima Al-Harbi", "Dr. Yasser Al-Malki",
        "Eng. Abdulrahman Qarni", "Dr. Sarah Al-Otaibi", "Dr. Faisal Al-Shehri", "Eng. Mohammed Kabli",
        "Prof. Waleed Al-Safi", "Dr. Mona Al-Ahmadi", "Dr. Sultan Al-Saud", "Dr. Layla Al-Sudairi"
    ]
    
    names_list_ar = [
        "د. أحمد الغامدي", "د. خالد الزهراني", "أ.د. فاطمة الحربي", "د. ياسر المالكي",
        "م. عبدالرحمن القرني", "د. سارة العتيبي", "د. فيصل الشهري", "م. محمد كابلي",
        "أ.د. وليد الصافي", "د. منى الأحمدي", "د. سلطان آل سعود", "د. ليلى السديري"
    ]

    industries = [
        "Hajj & Umrah Tech", "HealthTech & Biotech", "Clean Energy & Environment",
        "Smart Infrastructure & IoT", "Islamic Finance & Digital Economy"
    ]

    tracks_mapping = {
        1: "Masar Training Program (برنامج مسار التأهيلي)",
        2: "Masar Training Program (برنامج مسار التأهيلي)",
        3: "Nomow Incubator (حاضنة نمو)",
        4: "Nomow Incubator (حاضنة نمو)",
        5: "Wadi Makkah Accelerator (مسرعة وادي مكة)",
        6: "Wadi Makkah Accelerator (مسرعة وادي مكة)",
        7: "Wadi Makkah Ventures Fund (صندوق الاستثمار)",
        8: "Wadi Makkah Ventures Fund (صندوق الاستثمار)",
        9: "Wadi Makkah Ventures Fund (صندوق الاستثمار)"
    }

    projects = []
    
    # 1. Generate 140 Approved Projects (Historical Archive)
    for i in range(1, 141):
        # Choose a random base template and add slight variations
        base = random.choice(projects_templates)
        trl = random.randint(min(1, base["base_trl"] - 2), min(9, base["base_trl"] + 2))
        
        # Add index-based variations to make them look distinct
        title_suffix_en = f" - Phase {i // 10 + 1}" if i % 10 != 0 else " Initiative"
        title_suffix_ar = f" - المرحلة {i // 10 + 1}" if i % 10 != 0 else " مبادرة"
        
        # Choose author
        idx_author = random.randint(0, len(names_list) - 1)
        author_en = names_list[idx_author]
        author_ar = names_list_ar[idx_author]
        
        # Date within last 2 years
        days_ago = random.randint(10, 730)
        project_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        project = {
            "id": f"UQU-{1000 + i}",
            "title_en": base["title_en"] + title_suffix_en,
            "title_ar": base["title_ar"] + title_suffix_ar,
            "abstract_en": base["abstract_en"] + f" [Ref {i}] This study investigates localized optimization for Umm Al-Qura contexts.",
            "abstract_ar": base["abstract_ar"] + f" [مرجع {i}] تدرس هذه الدراسة الاستخدام الأمثل الموطن في سياق جامعة أم القرى.",
            "type": base["type"],
            "department": base["department"],
            "sector": base["sector"],
            "trl": trl,
            "author_en": author_en,
            "author_ar": author_ar,
            "status": "Approved",
            "submission_date": project_date,
            "approval_date": (datetime.strptime(project_date, "%Y-%m-%d") + timedelta(days=random.randint(2, 7))).strftime("%Y-%m-%d"),
            "track": tracks_mapping[trl],
            "commercial_apps_en": base["commercial_apps_en"],
            "commercial_apps_ar": base["commercial_apps_ar"],
            "customers_en": base["customers_en"],
            "customers_ar": base["customers_ar"],
            "startups": base["startups"],
            "roadmap_en": [
                "Patent Filing & IP Protection Setup",
                "Laboratory prototype testing under simulated conditions",
                "Pilot deployment in coordination with local government agencies",
                "Venture Capital pitch for commercial spinoff"
            ],
            "roadmap_ar": [
                "تسجيل براءة الاختراع وحماية الملكية الفكرية",
                "اختبار النموذج الأولي المعملي تحت ظروف محاكاة",
                "التطبيق التجريبي بالتنسيق مع الجهات الحكومية المحلية",
                "تقديم العروض للمستثمرين لتأسيس شركة ريادية مستقلة"
            ],
            "analyst_notes": f"Reviewed by Wadi Makkah IP office. High synergy with Saudi Vision 2030 {base['sector']} targets."
        }
        projects.append(project)

    # 2. Generate 15 Pending Projects (Awaiting Analyst review)
    for i in range(141, 156):
        base = random.choice(projects_templates)
        trl = random.randint(2, 7)
        
        idx_author = random.randint(0, len(names_list) - 1)
        author_en = names_list[idx_author]
        author_ar = names_list_ar[idx_author]
        
        # Recent submission within the last 5 days
        days_ago = random.randint(1, 5)
        project_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        project = {
            "id": f"UQU-{1000 + i}",
            "title_en": f"New Proposal: {base['title_en']} ({1000 + i})",
            "title_ar": f"مقترح جديد: {base['title_ar']} ({1000 + i})",
            "abstract_en": base["abstract_en"] + f" Proposed research draft submitting to Wadi Makkah review panel.",
            "abstract_ar": base["abstract_ar"] + f" مسودة البحث المقترحة المقدمة للجنة مراجعة وادي مكة.",
            "type": base["type"],
            "department": base["department"],
            "sector": base["sector"],
            "trl": trl,
            "author_en": author_en,
            "author_ar": author_ar,
            "status": "Pending",
            "submission_date": project_date,
            "approval_date": None,
            "track": tracks_mapping[trl],
            "commercial_apps_en": base["commercial_apps_en"],
            "commercial_apps_ar": base["commercial_apps_ar"],
            "customers_en": base["customers_en"],
            "customers_ar": base["customers_ar"],
            "startups": base["startups"],
            "roadmap_en": [
                "Detailed technical viability review",
                "Develop prototype with Wadi Makkah Innovation Lab",
                "Apply to Nomow Incubator"
            ],
            "roadmap_ar": [
                "مراجعة تفصيلية للجدوى التقنية",
                "تطوير النموذج الأولي في مختبر الابتكار بوادي مكة",
                "التقديم لحاضنة نمو"
            ],
            "analyst_notes": ""
        }
        projects.append(project)
        
    db_data = {"projects": projects}
    
    with open("data/db.json", "w", encoding="utf-8") as f:
        json.dump(db_data, f, ensure_ascii=False, indent=2)
        
    print(f"Generated database with {len(projects)} projects (140 approved, 15 pending).")

if __name__ == "__main__":
    generate_seed_data()
