/**
 * 英语闯关学习 — 贝壳英语 × TED 精听
 * 4大精品课程：日常口语 | 旅行英语 | 六级雅思 | TED精听
 * 每关5道选择题（含听力选择题），每题4个选项 + 正确答案 + 详细解析
 * 数据模型：{ type:'choice', question, options:[A,B,C,D], answer:索引, explanation, audioText? }
 */
const ENG_COURSES = [
  // ════════════ 1. 日常口语 ════════════
  {
    id: 'daily_life', name: '日常口语', icon: '🗣️', color: '#7ecba1',
    desc: '实用场景对话，覆盖社交、购物、餐饮、电话、工作',
    levels: [
      {
        id: 'dl1', title: '社交破冰', xp: 20,
        exercises: [
          { type: 'choice',
            question: '“嗨，很高兴认识你。我叫麦子，你呢？” 最地道得体的英文翻译是？',
            options: [
              'Nice to meet you. I am Maizi, and you?',
              'Hi, I see you. Who are you?',
              'Yo, tell me your name.',
              'Hello, are you good?'
            ],
            answer: 0,
            explanation: 'Nice to meet you 是初次见面最标准礼貌的开场；and you? 是口语化的反问对方名字。其余选项过于随意或中式。' },
          { type: 'choice',
            question: '句子 “I have heard a lot ___ you from Lisa.” 横线处应填？',
            options: [
              'from',
              'with',
              'about',
              'of'
            ],
            answer: 2,
            explanation: 'hear about sb. 表示“听说过某人”；hear from sb. 表示“收到某人来信”，两者不要混淆。' },
          { type: 'choice',
            question: '朗读 “I am from Longyou, a small town in Zhejiang.” 时，town 在英语国家的地道含义更接近？',
            options: [
              '大城市市中心',
              '县城或小镇',
              '乡村村落',
              '省份'
            ],
            answer: 1,
            explanation: '美式口语中 town 对应中国的县城/小镇，比 city 更生活化、更地道。' },
          { type: 'choice',
            question: '社交场景中 “break the ice” 的意思是？',
            options: [
              '把冰块打碎',
              '打破沉默、破冰',
              '天气变冷',
              '冷战'
            ],
            answer: 1,
            explanation: 'break the ice 是英语社交核心短语，指用闲聊打破尴尬、开启对话，是 small talk 的目的。' },
          { type: 'choice',
            question: '🎧 听 David 的自我介绍，他正在学什么？',
            audioText: "Hello everyone, I am David. I work as a graphic designer in Shanghai. In my free time, I love hiking and photography. I have been learning Chinese for two years.",
            options: [
              'Graphic design 平面设计',
              'Photography 摄影',
              'Chinese 中文',
              'English 英语'
            ],
            answer: 2,
            explanation: '"I have been learning Chinese for two years" 是现在完成进行时，表示从过去开始持续到现在还在进行的动作。' }
        ]
      },
      {
        id: 'dl2', title: '购物达人', xp: 25,
        exercises: [
          { type: 'choice',
            question: '“这件连衣裙有其他颜色吗？我想试试浅蓝色的。” 地道英文是？',
            options: [
              'Does this dress have other colors? I want light blue.',
              'Does this dress come in other colors? I would like to try the light blue one.',
              'This dress, other color? I try blue.',
              'Is there another color dress? Give me light blue.'
            ],
            answer: 1,
            explanation: 'come in + 颜色/尺码 是购物最常用句型，如 "Do these shoes come in size 38?"' },
          { type: 'choice',
            question: '句子 “It is a bit too tight. Can I try a ___ size?” 横线应填？',
            options: [
              'bigger',
              'loose',
              'larger',
              'wide'
            ],
            answer: 2,
            explanation: '衣服尺码大一号用 larger；loose 指宽松的版型，不是尺码大。' },
          { type: 'choice',
            question: '店员说 “30% off”，这表示打几折？',
            options: [
              '三折',
              '七折',
              '三折优惠价',
              '原价'
            ],
            answer: 1,
            explanation: '关键：30% off = 打七折！中文“打几折”与英文 off 方向相反，50% off = 打五折。' },
          { type: 'choice',
            question: '购物词汇 “on sale” 的意思是？',
            options: [
              '正在售卖中',
              '待售',
              '促销打折',
              '已下架'
            ],
            answer: 2,
            explanation: 'on sale 指促销打折；for sale 才是“待售/正在卖”。' },
          { type: 'choice',
            question: '🎧 听购物对话，顾客可在几天内退货？',
            audioText: "Customer: Can I return this if it does not fit? Clerk: Sure, you have 14 days to return. Just keep the receipt and the tags on.",
            options: [
              '7 days 七天',
              '14 days 十四天',
              '30 days 三十天',
              '90 days 九十天'
            ],
            answer: 1,
            explanation: '国外退货基本要求：吊牌在 + 收据在 + 期限内；keep the tags on = 保留吊牌不剪。' }
        ]
      },
      {
        id: 'dl3', title: '餐厅点餐', xp: 30,
        exercises: [
          { type: 'choice',
            question: '“请给我来一份牛排，五分熟，配薯条。” 地道英文是？',
            options: [
              'I want a steak, half cooked, with fries.',
              'I would like a steak, medium, with fries please.',
              'Give me beef, 50% done, and potatoes.',
              'Steak, five minutes, fries.'
            ],
            answer: 1,
            explanation: 'I would like = I would like，礼貌用法，比 I want 更客气；牛排熟度 medium 即五分熟。' },
          { type: 'choice',
            question: '句子 “We would like to ___ the bill, please.”（我们想AA制）横线应填？',
            options: [
              'share',
              'divide',
              'split',
              'cut'
            ],
            answer: 2,
            explanation: 'split the bill = AA制，现代通用说法；go Dutch 也指AA但偏老式。' },
          { type: 'choice',
            question: '餐厅用语 “soup of the day” 指的是？',
            options: [
              '免费汤',
              '每日例汤',
              '今日特价饮料',
              '自助汤'
            ],
            answer: 1,
            explanation: 'soup of the day 是餐厅每日例汤，服务员常用话术，常搭配今日特供。' },
          { type: 'choice',
            question: '在美国餐厅用餐，小费一般给餐费的多少？',
            options: [
              '5% 到 10%',
              '15% 到 20%',
              '50%',
              '不需要给'
            ],
            answer: 1,
            explanation: '美国小费文化：通常给餐费 15%-20%，服务员工资低、靠小费生活，不给被视为失礼。' },
          { type: 'choice',
            question: '🎧 听服务员介绍今日特供，价格是多少？',
            audioText: "Today's special is grilled salmon with lemon butter sauce, served with asparagus and mashed potatoes. It is 22 dollars. I highly recommend it.",
            options: [
              '$20',
              '$22',
              '$25',
              '$30'
            ],
            answer: 1,
            explanation: "Today's special = 今日特供；I highly recommend it = 强烈推荐，是西餐服务生常用话术。" }
        ]
      },
      {
        id: 'dl4', title: '电话与预约', xp: 30,
        exercises: [
          { type: 'choice',
            question: '“你好，我想预约周五下午三点的剪发。” 地道英文是？',
            options: [
              'I want a haircut on Friday 3pm.',
              'Hello, I would like to make an appointment for a haircut on Friday at 3 p.m.',
              'Book me hair cut Friday three.',
              'Hello, I need hair cut Friday.'
            ],
            answer: 1,
            explanation: 'make an appointment 用于医生/理发/银行等；reservation 专用于餐厅座位和酒店房间。' },
          { type: 'choice',
            question: '句子 “I am calling ___ confirm my appointment for tomorrow.” 横线应填？',
            options: [
              'for',
              'about',
              'to',
              'on'
            ],
            answer: 2,
            explanation: 'call to + verb 表示打电话的目的；call for/about 用法不同（call for help 呼救 / call about the job 打来问工作）。' },
          { type: 'choice',
            question: '电话英语中，自我介绍最标准的是？',
            options: [
              'I am Maizi speaking.',
              'This is Maizi speaking.',
              'My name is Maizi talk.',
              'Maizi is here.'
            ],
            answer: 1,
            explanation: '电话英语特有：this is...（不说 I am...）；May I speak to...（不说 Can I talk to...）。' },
          { type: 'choice',
            question: '🎧 听电话留言，新的预约时间是什么？',
            audioText: "Hi, this is Dr. Chen's office calling. We need to reschedule your appointment from Friday to next Monday at 10 a.m. Please call us back to confirm.",
            options: [
              'Friday at 10 a.m.',
              'Next Monday at 10 a.m.',
              'Next Monday at 2 p.m.',
              'This Saturday'
            ],
            answer: 1,
            explanation: 'reschedule = 重新安排时间，前缀 re- = 重新；航班延误、会议改期都会用到。' },
          { type: 'choice',
            question: '“请告诉他我打过电话，让他有空回给我。” 地道英文是？',
            options: [
              'Tell him I called and ask him to call me back when he is free.',
              'Say I phone, he call me free time.',
              'He should call me, I called.',
              'Tell him: I call, you call back.'
            ],
            answer: 0,
            explanation: 'tell him I called 用过去式表示“打过电话”；call me back = 回电话。' }
        ]
      },
      {
        id: 'dl5', title: '职场沟通', xp: 35,
        exercises: [
          { type: 'choice',
            question: '“我想申请周五请假一天，因为要参加教资考试。” 地道英文是？',
            options: [
              'I want Friday off because exam.',
              'I would like to request a day off on Friday because I am taking a teacher certification exam.',
              'I need no work Friday, exam day.',
              'Friday I absent, teacher test.'
            ],
            answer: 1,
            explanation: 'request a day off = 正式申请请假；take a day off = 自己决定休；call in sick = 当天请病假。' },
          { type: 'choice',
            question: '句子 “Could you ___ me a favor and cover my shift on Friday?” 横线应填？',
            options: [
              'make',
              'give',
              'do',
              'take'
            ],
            answer: 2,
            explanation: 'do me a favor 固定搭配；cover someone’s shift = 替班，shift 指排班。' },
          { type: 'choice',
            question: '美式职场短语 “touch base” 的意思是？',
            options: [
              '触碰基地',
              '简短同步、碰一下',
              '建立基地',
              '离职'
            ],
            answer: 1,
            explanation: '"Let’s touch base tomorrow" = 明天简短同步一下，是美式职场高频短语，不是“摸底座”。' },
          { type: 'choice',
            question: '🎧 听会议开场白，议程上有几个项目？',
            audioText: "Today we are going to discuss the Q3 marketing plan. Before we dive in, let me go over the agenda. We have three main items: budget review, campaign ideas, and timeline.",
            options: [
              'Two 两个',
              'Three 三个',
              'Four 四个',
              'Five 五个'
            ],
            answer: 1,
            explanation: 'before we dive in = 进入正题之前；agenda = 议程；Q3 = 第三季度（7-9月）。' },
          { type: 'choice',
            question: '职场短语 “on the same page” 的意思是？',
            options: [
              '在同一页纸上',
              '达成共识、理解一致',
              '阅读同一份文档',
              '交换意见'
            ],
            answer: 1,
            explanation: 'on the same page 指团队对目标/信息理解一致，是协作高频语，不是字面意思。' }
        ]
      }
    ]
  },

  // ════════════ 2. 旅行英语 ════════════
  {
    id: 'travel', name: '旅行英语', icon: '✈️', color: '#88b4e0',
    desc: '从值机到问路，覆盖出国旅行全场景',
    levels: [
      {
        id: 'tv1', title: '机场通关', xp: 25,
        exercises: [
          { type: 'choice',
            question: '“我要托运行李。这个是随身携带的。” 地道英文是？',
            options: [
              'I want to send my luggage. This is hand luggage.',
              'I would like to check in my luggage. This one is carry-on.',
              'My bag go plane, this bag with me.',
              'Give my luggage to plane, this carry.'
            ],
            answer: 1,
            explanation: '托运是 check in（不是 send）；值机也说 check in；carry-on = 随身行李。' },
          { type: 'choice',
            question: '机场常见提示 “Please ___ your boarding pass and passport ready.” 横线应填？',
            options: [
              'get',
              'make',
              'have',
              'put'
            ],
            answer: 2,
            explanation: 'have sth ready = 把某物准备好；boarding pass = 登机牌（不是 boarding card）。' },
          { type: 'choice',
            question: '机场词汇 “baggage claim” 指的是？',
            options: [
              '行李托运处',
              '行李提取处',
              '行李寄存',
              '行李打包'
            ],
            answer: 1,
            explanation: 'baggage claim = 行李提取处（英式英语用 luggage reclaim）。' },
          { type: 'choice',
            question: '🎧 听机场广播，航班在哪个登机口登机？',
            audioText: "Flight CA1234 to Beijing is now boarding at Gate 15. Passengers in Group A please proceed to the gate. This is the final boarding call.",
            options: [
              'Gate 13',
              'Gate 15',
              'Gate 50',
              'Gate 5'
            ],
            answer: 1,
            explanation: 'final boarding call = 最后登机通知；proceed to = 前往。' },
          { type: 'choice',
            question: '机场词汇 “layover” 的意思是？',
            options: [
              '直达',
              '中转停留',
              '航班延误',
              '航班取消'
            ],
            answer: 1,
            explanation: 'layover 一般指几小时的中转；stopover 可能是过夜。duty-free shop = 免税店。' }
        ]
      },
      {
        id: 'tv2', title: '酒店入住', xp: 25,
        exercises: [
          { type: 'choice',
            question: '“我有预订。名字是麦子，住三晚。” 地道英文是？',
            options: [
              'I booked. Name Maizi, three nights.',
              'I have a reservation under the name Maizi, for three nights.',
              'My name Maizi, I live three night.',
              'Reservation Maizi, 3 night.'
            ],
            answer: 1,
            explanation: 'under the name + 名字 = 以…名义预订；walk-in 指没预订直接来。' },
          { type: 'choice',
            question: '酒店常用问句 “What time is ___?”（早餐几点）横线应填？',
            options: [
              'checkout',
              'dinner',
              'breakfast',
              'lunch'
            ],
            answer: 2,
            explanation: '有些酒店早餐含在房费里叫 complimentary breakfast（免费早餐）。' },
          { type: 'choice',
            question: '客房服务用语 “Could I have an extra pillow and a blanket, please?” 中 extra 意思是？',
            options: [
              '额外的、加的',
              '昂贵的',
              '干净的',
              '免费的'
            ],
            answer: 0,
            explanation: 'extra pillow/blanket = 加枕头/毯子，礼貌又高效，直接打电话说即可。' },
          { type: 'choice',
            question: '🎧 听前台介绍，早餐几点结束？',
            audioText: "Your room is 1207 on the 12th floor. Breakfast is served from 6 a.m. to 10 a.m. in the restaurant on the 2nd floor. Checkout is at 11 a.m.",
            options: [
              '9 a.m.',
              '10 a.m.',
              '11 a.m.',
              '6 a.m.'
            ],
            answer: 1,
            explanation: 'breakfast served from 6 to 10 a.m.；checkout at 11 a.m.。' },
          { type: 'choice',
            question: '“我们想延迟退房到下午两点，可以吗？” 地道英文是？',
            options: [
              'We want leave room 2pm, ok?',
              'We would like a late checkout until 2 p.m., is that possible?',
              'Check out late 2pm please allow?',
              '2pm checkout, can?'
            ],
            answer: 1,
            explanation: 'late checkout = 延迟退房，是酒店常用请求表达。' }
        ]
      },
      {
        id: 'tv3', title: '问路交通', xp: 30,
        exercises: [
          { type: 'choice',
            question: '“打扰一下，请问最近的公交站在哪里？” 地道英文是？',
            options: [
              'Where is bus stop near?',
              'Excuse me, could you tell me where the nearest bus stop is?',
              'Bus station, where?',
              'I need bus stop, where?'
            ],
            answer: 1,
            explanation: 'bus stop = 路边站牌；bus station = 公交总站/长途客运站，不要搞混。' },
          { type: 'choice',
            question: '句子 “Go straight for two blocks, then turn ___ at the traffic light.” 横线应填？',
            options: [
              'leave',
              'straight',
              'left',
              'line'
            ],
            answer: 2,
            explanation: '问路经典句式：Go straight → turn left/right → It is on your left/right；block = 街区。' },
          { type: 'choice',
            question: '购票时 “one-way” 的意思是？',
            options: [
              '往返',
              '单程',
              '月票',
              '站台票'
            ],
            answer: 1,
            explanation: 'one-way = 单程；round-trip = 往返。' },
          { type: 'choice',
            question: '🎧 听路人指路，博物馆在哪里？',
            audioText: "Walk straight for about five minutes until you see a post office. The museum is right across the street from the post office. You can not miss it.",
            options: [
              'Next to the park',
              'Across from the post office',
              'Behind the library',
              'In front of the school'
            ],
            answer: 1,
            explanation: 'across from = 在…对面；You can not miss it = 你不会错过的。' },
          { type: 'choice',
            question: '交通词汇 “fare” 与 “fee” 的区别是？',
            options: [
              '两者完全相同',
              'fare 专指车费，fee 指服务费/手续费',
              'fee 是车费',
              '都指油费'
            ],
            answer: 1,
            explanation: 'fare 专指乘坐交通工具的费用；fee 是服务费/手续费。' }
        ]
      },
      {
        id: 'tv4', title: '紧急情况', xp: 30,
        exercises: [
          { type: 'choice',
            question: '“我的钱包被偷了。我需要联系中国大使馆。” 地道英文是？',
            options: [
              'My wallet stolen. I need Chinese embassy.',
              'My wallet was stolen. I need to contact the Chinese embassy.',
              'Someone take my wallet, embassy China.',
              'I lose wallet, call China big office.'
            ],
            answer: 1,
            explanation: 'was stolen 被动语态；embassy = 大使馆（首都级），consulate = 领事馆（城市级）。' },
          { type: 'choice',
            question: '句子 “I think I am ___. I need to see a doctor.” 横线应填？',
            options: [
              'hurt',
              'ill',
              'sick',
              'pain'
            ],
            answer: 2,
            explanation: '美式 feel sick = 不舒服/想吐；英式 sick 多指“想呕吐”，ill 指“生病”。' },
          { type: 'choice',
            question: '对花生过敏，正确的英文表达是？',
            options: [
              'I do not like peanuts.',
              'I am allergic to peanuts.',
              'Peanuts make me angry.',
              'Peanuts bad for me.'
            ],
            answer: 1,
            explanation: 'allergic to + 食物 = 对…过敏；contain = 含有。' },
          { type: 'choice',
            question: '🎧 听紧急对话，朋友发生了什么？',
            audioText: "My friend fell and hurt her ankle. It is swelling and she can not walk. Is there a hospital nearby? Can you call an ambulance?",
            options: [
              'She lost her passport',
              'She hurt her ankle',
              'She has a fever',
              'She missed the bus'
            ],
            answer: 1,
            explanation: 'ankle = 脚踝；swelling = 肿胀；ambulance = 救护车。' },
          { type: 'choice',
            question: '出国遇到紧急情况，以下哪个是正确的求助思路？',
            options: [
              '先拍照发朋友圈，再报警',
              '直接联系中国大使馆处理一切',
              '根据所在国拨打急救电话（如美国911、欧洲112）',
              '不用处理，等救援'
            ],
            answer: 2,
            explanation: '不同国家报警电话不同：美国 911，英国 999，欧洲统一 112。' }
        ]
      },
      {
        id: 'tv5', title: '文化体验', xp: 35,
        exercises: [
          { type: 'choice',
            question: '“这里有什么当地特色的东西值得买？” 地道英文是？',
            options: [
              'What local special worth buy?',
              'What local specialties are worth buying here?',
              'Local thing buy here?',
              'Good local buy?'
            ],
            answer: 1,
            explanation: 'local specialties = 当地特产；worth doing = 值得做。' },
          { type: 'choice',
            question: '在美国餐厅，给小费的性质是？',
            options: [
              '完全自愿，不给也无妨',
              '半强制，一般给 15%-20%',
              '法律强制必须给',
              '只接受现金'
            ],
            answer: 1,
            explanation: '美国小费半强制——服务员工资低、靠小费生活，不给被视为很没礼貌。' },
          { type: 'choice',
            question: '词汇 “authentic” 在 “authentic food” 中的意思是？',
            options: [
              '游客化的',
              '正宗的',
              '昂贵的',
              '便宜的'
            ],
            answer: 1,
            explanation: 'authentic = 正宗的；touristy = 游客化的（常含贬义）。' },
          { type: 'choice',
            question: '🎧 听文化指南，在日本人家不该做什么？',
            audioText: "When you visit a Japanese home, take off your shoes at the entrance. Bring a small gift like sweets or fruit. Never stick your chopsticks upright in a bowl of rice — that is a funeral ritual.",
            options: [
              'Take off shoes 脱鞋',
              'Bring a gift 带礼物',
              'Stick chopsticks upright in rice 筷子竖插米饭',
              'Say thank you 道谢'
            ],
            answer: 2,
            explanation: '把筷子竖插在米饭上是丧葬仪式，极为忌讳。' },
          { type: 'choice',
            question: '不同国家的手势含义可能？',
            options: [
              '全球统一',
              '完全相反（如竖大拇指在中东部分国家是侮辱）',
              '只有一种含义',
              '只在亚洲不同'
            ],
            answer: 1,
            explanation: '竖大拇指在美国表“好”，在一些中东国家是侮辱，手势含义因文化而异。' }
        ]
      }
    ]
  },

  // ════════════ 3. 六级/雅思备考 ════════════
  {
    id: 'exam_prep', name: '六级雅思', icon: '📚', color: '#e8a0bf',
    desc: '高频词汇、写作句型、阅读长难句、翻译专项',
    levels: [
      {
        id: 'ep1', title: '高频词汇（上）', xp: 30,
        exercises: [
          { type: 'choice',
            question: '“政府应该采取措施来缓解交通拥堵。” 地道英文是？',
            options: [
              'Government should do something about traffic.',
              'The government should take measures to alleviate traffic congestion.',
              'Government stop traffic jam.',
              'Leader make way for cars.'
            ],
            answer: 1,
            explanation: 'alleviate > relieve > ease 表“缓解”；congestion 专指交通拥堵，heavy traffic 更口语化。' },
          { type: 'choice',
            question: '句子 “The new policy has had a ___ impact on the economy.” 横线应填？',
            options: [
              'deep',
              'heavy',
              'profound',
              'big'
            ],
            answer: 2,
            explanation: 'profound impact = 深远影响，学术写作中的高分搭配，比 big influence 高级很多。' },
          { type: 'choice',
            question: '六级写作替换词：把 “important” 升级为学术词，应选？',
            options: [
              'big',
              'crucial',
              'normal',
              'usual'
            ],
            answer: 1,
            explanation: 'important → crucial 是高分替换；many → numerous；show → demonstrate；use → utilize。' },
          { type: 'choice',
            question: '🎧 听学术讲座，城市热岛效应的成因是？',
            audioText: "Cities can be up to 3 degrees Celsius warmer than rural areas. This is primarily due to the replacement of natural vegetation with concrete and asphalt, which absorb and retain heat.",
            options: [
              'Air pollution 空气污染',
              'Concrete and asphalt replacing vegetation 混凝土和沥青取代植被',
              'Population density 人口密度',
              'Car emissions 汽车排放'
            ],
            answer: 1,
            explanation: 'concrete = 混凝土；asphalt = 沥青；两者吸热储热导致城市比周围农村更热。' },
          { type: 'choice',
            question: '句子 “China ___ a rich culture of over 5,000 years.” 中 boast 的意思是？',
            options: [
              '吹嘘',
              '自豪地拥有',
              '炫耀',
              '夸大'
            ],
            answer: 1,
            explanation: 'boast 本意是“吹嘘”，但在正式语境中意为“自豪地拥有”。' }
        ]
      },
      {
        id: 'ep2', title: '翻译专项', xp: 30,
        exercises: [
          { type: 'choice',
            question: '“随着互联网的普及，越来越多的人选择在线学习。” 地道英文是？',
            options: [
              'Internet popular, more people study online.',
              'With the popularity of the Internet, more and more people are choosing to study online.',
              'Because internet, people online learn.',
              'Internet come, people learn net.'
            ],
            answer: 1,
            explanation: 'With the... of... 是翻译“随着…”最安全的高分模板。' },
          { type: 'choice',
            question: '句子 “Chinese culture ___ a long history of over 5,000 years.” 横线应填？',
            options: [
              'has',
              'owns',
              'boasts',
              'holds'
            ],
            answer: 2,
            explanation: 'boast = 自豪地拥有；China boasts a rich culture = 中国拥有灿烂文化。' },
          { type: 'choice',
            question: '“中国人认为红色象征着好运和幸福。” 地道英文是？',
            options: [
              'Chinese think red means good luck happy.',
              'Chinese people believe that red symbolizes good luck and happiness.',
              'Red is lucky in China.',
              'China red equals good thing.'
            ],
            answer: 1,
            explanation: 'symbolize = 象征，比 mean 更书面、更适合翻译题。' },
          { type: 'choice',
            question: '🎧 听雅思口语 Part 3，说话者对教育的整体看法是？',
            audioText: "Technology has both positive and negative effects on education. On the one hand, it makes information accessible. On the other hand, it can be a distraction. The key is to use technology wisely rather than letting it use you.",
            options: [
              'It should be banned 应该禁止',
              'It has both pros and cons, use it wisely 利弊兼具，明智使用',
              'It is only beneficial 只有好处',
              'It is only harmful 只有坏处'
            ],
            answer: 1,
            explanation: 'on the one hand... on the other hand... 表利弊两面；the key = 关键。' },
          { type: 'choice',
            question: '六级翻译高频结构 “With the development of..., ...” 用来翻译？',
            options: [
              '因为…',
              '随着…',
              '关于…',
              '除了…'
            ],
            answer: 1,
            explanation: 'With the development/rise/popularity of... 是翻译“随着…”的经典模板。' }
        ]
      },
      {
        id: 'ep3', title: '阅读长难句', xp: 35,
        exercises: [
          { type: 'choice',
            question: '“尽管这项研究存在局限性，但它提供了宝贵见解。” 地道英文是？',
            options: [
              'But study has limits, it gives ideas.',
              'Although this study has some limitations, it provides valuable insights into our understanding of climate change.',
              'Study limit, but good.',
              'Even study limited, insight yes.'
            ],
            answer: 1,
            explanation: 'limitations = 局限性；insights into = 对…的见解。' },
          { type: 'choice',
            question: '句子 “The theory, ___ was first proposed in the 1960s, has been widely accepted.” 横线应填？',
            options: [
              'that',
              'what',
              'which',
              'who'
            ],
            answer: 2,
            explanation: '非限制性定语从句（有逗号）只能用 which，不能用 that。' },
          { type: 'choice',
            question: '逻辑连接词 “nevertheless” 的功能是？',
            options: [
              '此外（递进）',
              '因此（因果）',
              '然而（转折）',
              '具体来说'
            ],
            answer: 2,
            explanation: 'nevertheless = 然而；furthermore = 此外；consequently = 因此；specifically = 具体来说。' },
          { type: 'choice',
            question: '🎧 听学术长句，哪种学习方法效果更好？',
            audioText: "Students who studied in shorter, more frequent sessions performed 30% better on tests than those who crammed for long hours, regardless of total time.",
            options: [
              'Long cramming sessions 长时间填鸭',
              'Shorter, more frequent sessions 短时高频',
              'Both performed equally 一样好',
              'Neither helped 都没用'
            ],
            answer: 1,
            explanation: 'cram = 临时抱佛脚；shorter frequent sessions = 短时高频学习更高效。' },
          { type: 'choice',
            question: '词汇 “correlation” 的意思是？',
            options: [
              '因果',
              '相关性',
              '巧合',
              '冲突'
            ],
            answer: 1,
            explanation: 'correlation = 相关性（不必然是因果）；cognitive = 认知的。' }
        ]
      },
      {
        id: 'ep4', title: '写作模板', xp: 35,
        exercises: [
          { type: 'choice',
            question: '“正方认为…而反方则认为…在我看来…” 地道英文是？',
            options: [
              'Good side say..., bad side say..., I think...',
              'Those in favor argue that... while opponents believe that... From my perspective...',
              'People think A, people think B, I view...',
              'One side yes, other side no, me...'
            ],
            answer: 1,
            explanation: 'Those in favor = 正方；opponents = 反方；From my perspective = 在我看来，是六级写作经典模板。' },
          { type: 'choice',
            question: '句子 “It is ___ noting that the issue has attracted widespread attention.” 横线应填？',
            options: [
              'worthy',
              'deserve',
              'worth',
              'value'
            ],
            answer: 2,
            explanation: 'It is worth noting that... = 值得注意的是…；worthy of + n.；deserve to do，三者搭配不同。' },
          { type: 'choice',
            question: '写作逻辑结构中，主体段1（body paragraph 1）应包含？',
            options: [
              '总结+升华',
              '论点+论据+例证',
              '引出话题',
              '反方观点'
            ],
            answer: 1,
            explanation: '主体段1：论点+论据+例证；主体段2：反方观点+反驳；conclusion：总结+升华/建议。' },
          { type: 'choice',
            question: '🎧 听雅思写作范文，作者最终立场是？',
            audioText: "While social media has brought people closer, it has also created a superficial connection that can never replace genuine interaction. Therefore, we should use it as a tool, not a substitute for real relationships.",
            options: [
              'Social media is harmful 社交媒体有害',
              'Use social media as a tool, not a replacement 当作工具而非替代',
              'Avoid social media entirely 完全避免',
              'Social media is perfect 完美无缺'
            ],
            answer: 1,
            explanation: 'substitute = 替代品；genuine = 真实的；use it as a tool 是关键立场。' },
          { type: 'choice',
            question: '写作开头 “In recent years, the issue of... has sparked heated debate.” 中 sparked 意思是？',
            options: [
              '结束',
              '引发',
              '忽视',
              '解决'
            ],
            answer: 1,
            explanation: 'spark heated debate = 引发激烈讨论，是高分写作开头句式。' }
        ]
      },
      {
        id: 'ep5', title: '综合冲刺', xp: 40,
        exercises: [
          { type: 'choice',
            question: '“终身学习已成为现代社会不可或缺的一部分。” 地道英文是？',
            options: [
              'Life learn is need in society.',
              'Lifelong learning has become an indispensable part of modern society.',
              'Always study important now.',
              'Learn whole life is part society.'
            ],
            answer: 1,
            explanation: 'indispensable = 不可或缺的；lifelong learning = 终身学习。' },
          { type: 'choice',
            question: '句子 “Only by ___ can we truly understand the complexity.” 横线应填？',
            options: [
              'theory',
              'reading',
              'practice',
              'thinking'
            ],
            answer: 2,
            explanation: 'Only + 状语放句首，主句要部分倒装：Only by working hard can we succeed. 意为“只有通过实践”。' },
          { type: 'choice',
            question: '🎧 听 TED 风格演讲，21世纪最有价值的技能是？',
            audioText: "The most valuable skill in the 21st century is not what you know — it is your ability to learn new things quickly and adapt. Because the half-life of knowledge is getting shorter every year.",
            options: [
              'Knowing many facts 知道很多事实',
              'Learning how to learn and adapt 学会学习并适应',
              'Getting good grades 拿高分',
              'Memorizing formulas 背公式'
            ],
            answer: 1,
            explanation: 'half-life of knowledge = 知识半衰期；adapt = 适应，是21世纪核心能力。' },
          { type: 'choice',
            question: '替换词：把 “a lot of” 升级为学术表达，应选？',
            options: [
              'many of',
              'a considerable amount of',
              'lots of',
              'plenty of'
            ],
            answer: 1,
            explanation: 'a lot of → a considerable amount of 是高分替换；very important → of utmost importance。' },
          { type: 'choice',
            question: '句子 “The benefits far outweigh the drawbacks.” 中 outweigh 意思是？',
            options: [
              '等于',
              '远远超过',
              '低于',
              '抵消'
            ],
            answer: 1,
            explanation: 'far outweigh = 远远超过；drawback = 缺点。' }
        ]
      }
    ]
  },

  // ════════════ 4. TED 精听 ════════════
  {
    id: 'ted', name: 'TED 精听', icon: '🎬', color: '#f4a261',
    desc: '精选TED演讲片段：听→理解→积累→模仿（听力选择题）',
    levels: [
      {
        id: 'ted1', title: '《拖延症大师》', xp: 30,
        description: 'Tim Urban: Inside the Mind of a Master Procrastinator',
        exercises: [
          { type: 'choice',
            question: '🎧 Tim Urban 说拖延症患者的大脑里多了一只什么？',
            audioText: "Both of these brains have a rational decision-maker in them. But the procrastinator's brain also has an instant gratification monkey.",
            options: [
              'A faster processor 更快的处理器',
              'An instant gratification monkey 即时满足猴子',
              'More brain cells 更多脑细胞',
              'A panic button 紧急按钮'
            ],
            answer: 1,
            explanation: 'Tim Urban 用“即时满足猴子”比喻拖延症：猴子只关心 easy and fun，抢走理性的方向盘。' },
          { type: 'choice',
            question: 'Tim Urban 发明的 “Dark Playground” 指的是？',
            options: [
              '一个真实的游乐场',
              '在该有负罪感时休闲的地方',
              '夜晚的公园',
              '黑暗的房间'
            ],
            answer: 1,
            explanation: 'Dark Playground：在应该有负罪感的情况下休闲，玩得不痛快，是拖延症的核心体验之一。' },
          { type: 'choice',
            question: '🎧 听 Tim Urban 谈人生日历，他想表达？',
            audioText: "The boxes represent weeks of a 90-year life. That is not that many boxes. And we have already filled a bunch of them. So I think we need to think about what we are really procrastinating on.",
            options: [
              '人生很长，不用急',
              '人生有限，要思考真正在拖延什么',
              '多填几个格子',
              '90年太短'
            ],
            answer: 1,
            explanation: '用人生周数可视化强调时间的有限与拖延的代价。' },
          { type: 'choice',
            question: '“Procrastination is not a time management problem, it is an emotion regulation problem.” 这句话说明拖延症本质是？',
            options: [
              '时间不够',
              '情绪管理问题',
              '懒惰',
              '智力问题'
            ],
            answer: 1,
            explanation: '心理学观点：拖延不是因为懒，而是面对任务产生焦虑/恐惧/无聊后逃避。' },
          { type: 'choice',
            question: '🎧 听片段，拖延者面对任务时谁在掌控方向盘？',
            audioText: "The instant gratification monkey does not care about the future. He only cares about two things: easy and fun. And he takes the wheel away from the rational decision-maker.",
            options: [
              '理性决策者',
              '即时满足猴子',
              '恐慌怪兽',
              '没有人'
            ],
            answer: 1,
            explanation: 'take the wheel away = 抢走方向盘；猴子掌管时理性决策失效。' }
        ]
      },
      {
        id: 'ted2', title: '《脆弱的力量》', xp: 30,
        description: "Brené Brown: The Power of Vulnerability",
        exercises: [
          { type: 'choice',
            question: '🎧 Brené Brown 如何定义 vulnerability？',
            audioText: "Vulnerability is not weakness. I define vulnerability as emotional risk, exposure, uncertainty. It fuels our daily lives.",
            options: [
              'Weakness and fear 软弱与恐惧',
              'Emotional risk, exposure, uncertainty 情绪风险、暴露、不确定',
              'Being overly sensitive 过度敏感',
              'Physical weakness 身体虚弱'
            ],
            answer: 1,
            explanation: 'Brown 研究12年发现：脆弱不是软弱，而是勇气的精准度量。' },
          { type: 'choice',
            question: 'Brené Brown 的结论：敢于示弱的人？',
            options: [
              '更弱小',
              '反而更强大、更充实',
              '更容易受伤',
              '不值得信任'
            ],
            answer: 1,
            explanation: '活得最充实的人是那些敢于脆弱、敢于不完美的人。' },
          { type: 'choice',
            question: '🎧 听片段，关于自我同情，Brown 说什么？',
            audioText: "We can not practice compassion with other people if we can not treat ourselves kindly. We should be the first to be kind to ourselves.",
            options: [
              '先对自己友善，才能对别人有同情',
              '对别人好就行',
              '不要同情自己',
              '同情是软弱'
            ],
            answer: 0,
            explanation: 'treat ourselves kindly = 善待自己；compassion = 同情心。' },
          { type: 'choice',
            question: '“You are worthy of love and belonging.” 中 belonging 意思是？',
            options: [
              'belongings 物品',
              '归属感',
              '长寿',
              '财富'
            ],
            answer: 1,
            explanation: 'belonging = 归属感，是 Brown 理论的核心需求之一。' },
          { type: 'choice',
            question: '🎧 听片段，脆弱与勇气的关系是？',
            audioText: "Vulnerability is our most accurate measurement of courage. You can not get to courage without walking through vulnerability.",
            options: [
              '脆弱与勇气无关',
              '脆弱是勇气的精准度量，是必经之路',
              '脆弱阻碍勇气',
              '勇气不需要脆弱'
            ],
            answer: 1,
            explanation: '没有脆弱就没有勇气；vulnerability 是 courage 的前提。' }
        ]
      },
      {
        id: 'ted3', title: '《学校扼杀创造力吗》', xp: 35,
        description: "Ken Robinson: Do Schools Kill Creativity?",
        exercises: [
          { type: 'choice',
            question: '🎧 Ken Robinson 说孩子们不害怕什么？',
            audioText: "Kids will take a chance. If they do not know, they will have a go. They are not frightened of being wrong. If you are not prepared to be wrong, you will never come up with anything original.",
            options: [
              'Being wrong 犯错',
              'Learning new things 学新东西',
              'Going to school 上学',
              'Asking questions 提问'
            ],
            answer: 0,
            explanation: 'Robinson 核心观点：教育系统惩罚错误，但创造力需要敢于犯错。' },
          { type: 'choice',
            question: 'Ken Robinson 名言 “We grow out of creativity” 暗示创造力是？',
            options: [
              '天生增长',
              '被教育“教”没的',
              '与年龄无关',
              '只属于天才'
            ],
            answer: 1,
            explanation: '讽刺地说创造力是被“教育出去的”；grow out of = 长大后不再（如尿床）。' },
          { type: 'choice',
            question: '🎧 听片段，Robinson 认为创造力在教育中应？',
            options: [
              '可有可无',
              '与读写能力同等重要',
              '低于学术成绩',
              '只给艺术生'
            ],
            answer: 1,
            explanation: 'creativity now is as important as literacy；treat it with the same status。' },
          { type: 'choice',
            question: '“If you are not prepared to be wrong, you will never come up with anything original.” 中 original 意思是？',
            options: [
              '原创的',
              '古老的',
              '普通的',
              '错误的'
            ],
            answer: 0,
            explanation: 'original = 原创的；come up with = 想出。' },
          { type: 'choice',
            question: '🎧 听片段，关于孩子与错误，Robinson 观察到？',
            audioText: "By the time they get to be adults, most kids have lost that capacity. They have become frightened of being wrong.",
            options: [
              '成年人更敢犯错',
              '多数孩子长大后害怕犯错',
              '孩子一直不怕错',
              '教育鼓励犯错'
            ],
            answer: 1,
            explanation: 'capacity = 能力；成长过程中失去敢于犯错的能力。' }
        ]
      },
      {
        id: 'ted4', title: '《肢体语言塑造你》', xp: 35,
        description: "Amy Cuddy: Your Body Language May Shape Who You Are",
        exercises: [
          { type: 'choice',
            question: '🎧 Amy Cuddy 推荐的“免费生活技巧”是？',
            audioText: "I want to start by offering you a free, no-tech life hack. All it requires: change your posture for two minutes before a stressful situation.",
            options: [
              'Meditate before meetings 开会前冥想',
              'Change your posture for two minutes 改变姿势两分钟',
              'Drink more water 多喝水',
              'Exercise daily 每天锻炼'
            ],
            answer: 1,
            explanation: '“强力姿势”power posing：面试前在私密处叉腰站两分钟，能改变体内激素水平更自信。' },
          { type: 'choice',
            question: 'Amy Cuddy 的核心链条是？',
            options: [
              '思维→身体→行为',
              '身体→思维→行为→结果',
              '行为→结果→身体',
              '结果→思维'
            ],
            answer: 1,
            explanation: 'Our bodies change our minds, minds change behavior, behavior changes outcomes。' },
          { type: 'choice',
            question: '🎧 听片段，做“强力姿势”对激素的影响是？',
            audioText: "Get your testosterone up. Get your cortisol down. Configure your brain to cope the best in that situation.",
            options: [
              '睾酮下降，皮质醇上升',
              '睾酮上升，皮质醇下降',
              '两者都上升',
              '两者都下降'
            ],
            answer: 1,
            explanation: 'testosterone = 睾酮（自信相关）；cortisol = 皮质醇（压力相关）。' },
          { type: 'choice',
            question: 'Amy Cuddy 把经典 “fake it till you make it” 升级为？',
            options: [
              'Fake it till you leave',
              'Fake it till you become it',
              'Make it or break it',
              'Be real always'
            ],
            answer: 1,
            explanation: '不只是“装到成功”，而是“装到成为”并内化 internalize。' },
          { type: 'choice',
            question: '🎧 听片段，Cuddy 建议在哪里做强力姿势？',
            audioText: "Try doing this in the elevator, in a bathroom stall, at your desk behind closed doors. Before you go into the next stressful evaluative situation.",
            options: [
              '只在健身房',
              '电梯、洗手间隔间、关门的办公桌前',
              '只在家里',
              '公开场合'
            ],
            answer: 1,
            explanation: '在压力情境前（如面试）的私密处做两分钟即可。' }
        ]
      },
      {
        id: 'ted5', title: '《伟大的领袖如何激励行动》', xp: 40,
        description: "Simon Sinek: How Great Leaders Inspire Action",
        exercises: [
          { type: 'choice',
            question: '🎧 Simon Sinek 说很少有人知道的是什么？',
            audioText: "Every person knows what they do. Some know how. But very few know why they do what they do. By why I mean your purpose, your cause, your belief.",
            options: [
              'What they do 做什么',
              'How they do it 怎么做',
              'Why they do what they do 为什么做',
              'Where they work 在哪工作'
            ],
            answer: 2,
            explanation: '黄金圈法则 Golden Circle：Why → How → What；伟大品牌从 Why 开始沟通。' },
          { type: 'choice',
            question: 'Simon Sinek 最著名的一句话是？',
            options: [
              'People buy what you do.',
              'People do not buy what you do; they buy why you do it.',
              'People buy cheap things.',
              'People buy from everyone.'
            ],
            answer: 1,
            explanation: '人们买的不是产品，而是信念；苹果卖的不是电脑，是“挑战现状”。' },
          { type: 'choice',
            question: '🎧 听片段，Martin Luther King 的演讲题目是？',
            audioText: "Martin Luther King gave the I have a dream speech, not the I have a plan speech. He told people what he believed.",
            options: [
              'I have a plan 我有一个计划',
              'I have a dream 我有一个梦想',
              'I have a goal 我有一个目标',
              'I have a method 我有一个方法'
            ],
            answer: 1,
            explanation: '金博士讲的是信念（belief）而非计划，所以打动人心。' },
          { type: 'choice',
            question: 'Simon Sinek 的“黄金圈”从内到外的顺序是？',
            options: [
              'What → How → Why',
              'Why → How → What',
              'How → What → Why',
              'Why → What → How'
            ],
            answer: 1,
            explanation: '伟大组织从 Why（目的/信念）开始沟通，普通品牌从 What 开始。' },
          { type: 'choice',
            question: '🎧 听片段，关于“目标客户”，Sinek 说？',
            audioText: "The goal is not to do business with everyone who needs what you have. The goal is to do business with people who believe what you believe.",
            options: [
              '和所有需要产品的人做生意',
              '和相信你信念的人做生意',
              '只和有钱人做生意',
              '不和任何人做生意'
            ],
            answer: 1,
            explanation: '吸引同信念的人，而非所有潜在客户。' }
        ]
      }
    ]
  }
];
