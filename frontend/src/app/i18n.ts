// i18n lüğətləri (C.2: əvvəl GardropApp.tsx-də inline idi). Tipli modul — @ts-nocheck YOX.
// Açar = Azərbaycanca mənbə mətn; dəyər = tərcümə. 'az' mənbə dilidir (lüğət yoxdur).

export type Lang = 'az' | 'ru' | 'en';

export const LANGS = [{code:'az',label:'AZ',name:'Azərbaycan'},{code:'ru',label:'RU',name:'Русский'},{code:'en',label:'EN',name:'English'}];
export const I18N = {
  ru: {
    // Naviqasiya / header
    'Ana səhifə':'Главная','Kataloq':'Каталог','Mağazalar':'Магазины','Seçilmişlər':'Избранное','Səbət':'Корзина','Profil':'Профиль','Hesabım':'Мой аккаунт',
    'Kişi':'Мужчинам','Qadın':'Женщинам','Uşaq':'Детям','Ayaqqabı':'Обувь','Yeni gələnlər':'Новинки','Endirimlər':'Скидки',
    'Axtar...':'Поиск...','Məhsul, marka və ya kateqoriya axtarın...':'Поиск товаров, брендов или категорий...',
    'Daxil ol':'Войти','Çıxış':'Выйти','Qeydiyyatdan keç':'Регистрация',
    // Ümumi düymələr
    'Səbətə əlavə et':'В корзину','✓ Səbətdə':'✓ В корзине','Hamısına bax':'Смотреть все','Davam et →':'Продолжить →','← Geri':'← Назад','Kataloqa keç':'Перейти в каталог',
    'Stokda yoxdur':'Нет в наличии','Filtrlər':'Фильтры','Filtrləri təmizlə':'Сбросить фильтры','məhsul':'товаров','Bütün məhsullar':'Все товары',
    // Sıralama
    'Ən yenilər':'Новинки','Ucuzdan bahaya':'Сначала дешёвые','Bahadan ucuza':'Сначала дорогие','Ən yüksək reytinq':'По рейтингу',
    // Filtr başlıqları
    'Kateqoriyalar':'Категории','Alt kateqoriya':'Подкатегория','Qiymət':'Цена','Ölçü (stokda)':'Размер (в наличии)','Rəng':'Цвет','Material':'Материал','🏷️ Yalnız endirimli':'🏷️ Только со скидкой',
    // Məhsul səhifəsi
    'Rəylər':'Отзывы','Rəy yazın':'Написать отзыв','Rəy göndər':'Отправить отзыв','Məhsul haqqında':'О товаре','Bunları da bəyənə bilərsiniz':'Вам также может понравиться','Seçilmişlərə əlavə et':'В избранное','✓ Təsdiqlənmiş alıcı':'✓ Проверенный покупатель','Hələ rəy yoxdur.':'Отзывов пока нет.',
    // Səbət
    'Səbətiniz boşdur':'Ваша корзина пуста','Sifarişi rəsmiləşdir':'Оформить заказ','Cəmi':'Итого','Məbləğ':'Сумма','Çatdırılma':'Доставка','Endirim':'Скидка',
    // Checkout
    'Çatdırılma ünvanı':'Адрес доставки','Ödəniş':'Оплата','Ödəniş üsulu':'Способ оплаты','Sifarişi təsdiqləyin':'Подтвердите заказ','Sifariş xülasəsi':'Сводка заказа','Kupon kodu':'Промокод','Tətbiq':'Применить','Ad':'Имя','Soyad':'Фамилия','Telefon':'Телефон','Sifarişi ver 🎉':'Оформить заказ 🎉','Təsdiq':'Подтверждение',
    // Profil
    'Sifarişlərim':'Мои заказы','Ölçülərim':'Мои размеры','Ünvanlar':'Адреса','Tənzimləmələr':'Настройки','Dil':'Язык','Seçilmişlərə keç →':'К избранному →','Səbətə keç →':'В корзину →','Profilə keç →':'В профиль →','Hələ seçilmiş məhsul yoxdur':'Пока нет избранных товаров','Sifariş izləmə':'Отслеживание заказа','Hələ sifariş yoxdur':'Заказов пока нет','Detallar':'Подробнее','Gizlət':'Скрыть','Yenidən sifariş':'Повторить заказ',
    // Auth
    'Hesaba daxil olun':'Войдите в аккаунт','Hesab yaradın':'Создайте аккаунт','Email':'Email','Şifrə':'Пароль','İstifadəçi şərtlərini qəbul edirəm':'Принимаю условия использования','Hesabınız yoxdur?':'Нет аккаунта?','Artıq hesabınız var?':'Уже есть аккаунт?','Daxil olun':'Войдите','Qeydiyyatdan keçin':'Зарегистрируйтесь',
    'Xoş gəldiniz':'Добро пожаловать','Hesabınıza daxil olun':'Войдите в свой аккаунт','Şifrəni unutmusunuz?':'Забыли пароль?','və ya':'или','Google ilə daxil ol':'Войти через Google','Adınız':'Ваше имя','Soyadınız':'Ваша фамилия','Minlərlə brend, bir platformada':'Тысячи брендов на одной платформе','Ən az 6 simvol':'Минимум 6 символов',
  },
  en: {
    'Ana səhifə':'Home','Kataloq':'Catalog','Mağazalar':'Stores','Seçilmişlər':'Favorites','Səbət':'Cart','Profil':'Profile','Hesabım':'My account',
    'Kişi':'Men','Qadın':'Women','Uşaq':'Kids','Ayaqqabı':'Shoes','Yeni gələnlər':'New arrivals','Endirimlər':'Sale',
    'Axtar...':'Search...','Məhsul, marka və ya kateqoriya axtarın...':'Search products, brands or categories...',
    'Daxil ol':'Sign in','Çıxış':'Sign out','Qeydiyyatdan keç':'Sign up',
    'Səbətə əlavə et':'Add to cart','✓ Səbətdə':'✓ In cart','Hamısına bax':'View all','Davam et →':'Continue →','← Geri':'← Back','Kataloqa keç':'Go to catalog',
    'Stokda yoxdur':'Out of stock','Filtrlər':'Filters','Filtrləri təmizlə':'Clear filters','məhsul':'products','Bütün məhsullar':'All products',
    'Ən yenilər':'Newest','Ucuzdan bahaya':'Price: low to high','Bahadan ucuza':'Price: high to low','Ən yüksək reytinq':'Top rated',
    'Kateqoriyalar':'Categories','Alt kateqoriya':'Subcategory','Qiymət':'Price','Ölçü (stokda)':'Size (in stock)','Rəng':'Color','Material':'Material','🏷️ Yalnız endirimli':'🏷️ On sale only',
    'Rəylər':'Reviews','Rəy yazın':'Write a review','Rəy göndər':'Submit review','Məhsul haqqında':'About the product','Bunları da bəyənə bilərsiniz':'You may also like','Seçilmişlərə əlavə et':'Add to favorites','✓ Təsdiqlənmiş alıcı':'✓ Verified buyer','Hələ rəy yoxdur.':'No reviews yet.',
    'Səbətiniz boşdur':'Your cart is empty','Sifarişi rəsmiləşdir':'Checkout','Cəmi':'Total','Məbləğ':'Subtotal','Çatdırılma':'Delivery','Endirim':'Discount',
    'Çatdırılma ünvanı':'Delivery address','Ödəniş':'Payment','Ödəniş üsulu':'Payment method','Sifarişi təsdiqləyin':'Confirm your order','Sifariş xülasəsi':'Order summary','Kupon kodu':'Coupon code','Tətbiq':'Apply','Ad':'First name','Soyad':'Last name','Telefon':'Phone','Sifarişi ver 🎉':'Place order 🎉','Təsdiq':'Confirm',
    'Sifarişlərim':'My orders','Ölçülərim':'My sizes','Ünvanlar':'Addresses','Tənzimləmələr':'Settings','Dil':'Language','Seçilmişlərə keç →':'Go to favorites →','Səbətə keç →':'Go to cart →','Profilə keç →':'Go to profile →','Hələ seçilmiş məhsul yoxdur':'No favorites yet','Sifariş izləmə':'Order tracking','Hələ sifariş yoxdur':'No orders yet','Detallar':'Details','Gizlət':'Hide','Yenidən sifariş':'Reorder',
    'Hesaba daxil olun':'Sign in to your account','Hesab yaradın':'Create an account','Email':'Email','Şifrə':'Password','İstifadəçi şərtlərini qəbul edirəm':'I accept the terms of service','Hesabınız yoxdur?':'No account?','Artıq hesabınız var?':'Already have an account?','Daxil olun':'Sign in','Qeydiyyatdan keçin':'Sign up',
    'Xoş gəldiniz':'Welcome','Hesabınıza daxil olun':'Sign in to your account','Şifrəni unutmusunuz?':'Forgot password?','və ya':'or','Google ilə daxil ol':'Sign in with Google','Adınız':'Your first name','Soyadınız':'Your last name','Minlərlə brend, bir platformada':'Thousands of brands, one platform','Ən az 6 simvol':'At least 6 characters',
  },
};
// Tam əhatə — saytın qalan interfeys sətirləri (createElement wrap-i ilə hər yerdə tətbiq olunur)
Object.assign(I18N.ru, {
  '← Geri qayıt':'← Назад','← Saxlanmış ünvanlardan seç':'← Выбрать из сохранённых адресов','+ Yeni ünvan':'+ Новый адрес','+ Yeni ünvan əlavə et':'+ Добавить новый адрес',
  '♀ Qadın':'♀ Женский','♂ Kişi':'♂ Мужской','⚠ Backend serverə qoşulmaq mümkün olmadı.':'⚠ Не удалось подключиться к серверу.',
  '✅ Sifarişi təsdiqləyin':'✅ Подтвердите заказ','✏️ Redaktə et':'✏️ Редактировать','✏️ Yenidən keç':'✏️ Пройти заново','✓ Yadda saxlanıldı':'✓ Сохранено',
  '💳 Ödəniş':'💳 Оплата','💳 Ödəniş üsulu':'💳 Способ оплаты','📍 Çatdırılma':'📍 Доставка','📍 Çatdırılma ünvanı':'📍 Адрес доставки','📏 Ölçülərim':'📏 Мои размеры',
  '📏 Necə ölçməli? (sadə ölçü lenti kifayətdir)':'📏 Как измерять? (достаточно простой ленты)','🚚 Çatdırılma məlumatı':'🚚 Информация о доставке','🚚 Sifariş izləmə':'🚚 Отслеживание заказа',
  'axtarılır…':'поиск…','Axtarış nəticələri':'Результаты поиска','AI ÖLÇÜ':'AI РАЗМЕР','AI ölçü hesablanır…':'Расчёт AI размера…','AI ölçü məsləhəti':'AI совет по размеру','AI tövsiyələri bu məlumatlara əsaslanır':'Рекомендации AI основаны на этих данных',
  'Aktivləşdirmək üçün hesaba daxil olun':'Войдите, чтобы активировать','Alış-verişə başla':'Начать покупки','Alış-verişə başlamaq üçün geyim kataloquna keçin':'Перейдите в каталог одежды, чтобы начать покупки',
  'Ana səhifədə "Sənin üçün seçdik" bölməsini göstər':'Показывать раздел «Подобрано для вас» на главной','arıq':'худой',
  'Ayaq uzunluğun':'Длина ваших ног','Ayaqqabı ölçü cədvəli':'Таблица размеров обуви','Ayaqqabı ölçün':'Ваш размер обуви','Azərbaycan':'Азербайджан',
  'Azərbaycanın aparıcı geyim mağazaları Gardrop-da.':'Ведущие магазины одежды Азербайджана на Gardrop.','Azərbaycanın multi-vendor geyim marketplace-i.':'Мульти-вендорный маркетплейс одежды Азербайджана.','Bakı':'Баку',
  'Başqa açar söz ilə axtarın':'Попробуйте другое ключевое слово','Bel genişliyin':'Ширина вашей талии','Bel nahiyən necədir?':'Какая у вас талия?','Beynəlxalq INT standartı (sm ilə)':'Международный стандарт INT (в см)',
  'Bədən ölçülərinə əsasən hər məhsul üçün uyğun ölçünü tövsiyə edirik.':'На основе ваших мерок мы рекомендуем подходящий размер для каждого товара.','Bədən siluetini və başlanğıc ölçünü bunlardan hesablayırıq.':'По ним мы рассчитываем силуэт тела и начальный размер.','Bədənin ən incə hissəsi — təbii bel xətti.':'Самая узкая часть тела — естественная линия талии.',
  'Bəli, ləğv et':'Да, отменить','Bəyəndiyiniz məhsulları seçilmişlərə əlavə edin':'Добавляйте понравившиеся товары в избранное','Bilmirəm / keç':'Не знаю / пропустить','böyük':'большой',
  'Bu əməliyyat hesab tələb edir':'Это действие требует аккаунта','Bu kateqoriyada məhsul tapılmadı':'В этой категории товары не найдены','Bu məhsula artıq rəy vermisiniz. Təşəkkürlər!':'Вы уже оставили отзыв на этот товар. Спасибо!',
  'Bu məhsulu aldınız — təcrübənizi ulduz, şərh və şəkillə paylaşın.':'Вы купили этот товар — поделитесь оценкой, отзывом и фото.','Bu məkanı seç':'Выбрать это место','Bu sifarişi ləğv etmək istəyirsiniz?':'Вы хотите отменить этот заказ?','Bu ünvan profilinizə də əlavə olunacaq.':'Этот адрес также будет добавлен в ваш профиль.',
  'Cinsiyyət':'Пол','Cinsiyyət və bədən ölçüləri':'Пол и мерки тела','Cinsiyyətin':'Ваш пол','Çatdırıldı':'Доставлен','Çəki':'Вес','Çiyin':'Плечи','Çiyin genişliyin':'Ширина ваших плеч','Çiyinlərin digərləri ilə müqayisədə necədir?':'Какие у вас плечи по сравнению с другими?','çox iri':'очень крупный',
  'Daxil olmağa qayıt':'Вернуться ко входу','Dəstək':'Поддержка','dolğun':'полный','E-poçt bildirişləri':'Email-уведомления','Email göndərildi!':'Письмо отправлено!','Email ünvanınıza bərpa linki göndərəcəyik':'Мы отправим ссылку для восстановления на вашу почту','Email və şifrəni daxil edin':'Введите email и пароль',
  'ENDİRİM SEZONU':'СЕЗОН СКИДОК','Endirimlərə bax':'Смотреть скидки','EU standartı, 36–46 (etiketdəki rəqəm).':'Стандарт EU, 36–46 (цифра на этикетке).','ədəd':'шт.','Əlavə et':'Добавить','Ən çox soruşulan sualların cavabları':'Ответы на самые частые вопросы','Ətək':'Юбка',
  'geniş':'широкий','Geniş':'Широкий','Göndərilir…':'Отправка…','Hamısı':'Все','Hamısını sil':'Удалить все','Hazırlanır':'Готовится','Hazırlandı':'Готов','Ləğv edildi':'Отменён','Niyə bahadır?':'Почему так дорого?','Anladım':'Понятно','Pulsuz':'Бесплатно','Standart':'Стандарт','Ekspress':'Экспресс','qaldı':'осталось','Pulsuz çatdırılmaya':'До бесплатной доставки','Hesab məlumatları':'Данные аккаунта','Hesabdan çıx':'Выйти из аккаунта','Hələ ünvan əlavə edilməyib':'Адреса ещё не добавлены','Hüquqi':'Юридическое',
  'Xəritədə dəyiş':'Изменить на карте','Xəritədən məkan seç':'Выбрать место на карте','Xəritədən seç':'Выбрать на карте','Xəritəyə klikləyin və ya markeri sürüşdürün':'Кликните по карте или перетащите маркер','Xəta baş verdi':'Произошла ошибка','Xüsusilə üst geyimlər və şalvar üçün lazımdır.':'Особенно нужно для верхней одежды и брюк.',
  'İlk sifarişinizi verin':'Сделайте свой первый заказ','incə':'узкий','İptal':'Отменён','İstifadəçi şərtlərini qəbul edin':'Примите условия использования','Kartla ödəniş':'Оплата картой','Kartla ödəniş tezliklə':'Оплата картой скоро',
  'Keyfiyyətli parçalar, eleqant dizayn və AI ölçü məsləhəti bir arada.':'Качественные ткани, элегантный дизайн и AI-совет по размеру вместе.','kiçik':'маленький','Köynək':'Рубашка','Kupon etibarsızdır':'Промокод недействителен',
  'Qarın':'Живот','Qarın genişliyin':'Ширина вашего живота','qısa':'короткий','Qısa':'Короткий','orta':'средний','Orta':'Средний',
  'Lent qoltuqaltından keçərək döşün ən çıxıntılı hissəsindən dairəvi ölçülür.':'Лента проходит под мышками и измеряется по самой выступающей части груди.','Ləğv et':'Отменить','Ləğv etmək üçün dəstəklə əlaqə saxlayın':'Для отмены свяжитесь с поддержкой','Link göndər':'Отправить ссылку',
  'Mağaza tapılmadı':'Магазин не найден','Mağaza:':'Магазин:','MAĞAZALAR':'МАГАЗИНЫ','Mağazalara bax':'Смотреть магазины','Məhsul silindi':'Товар удалён','məhsul tapıldı':'товаров найдено','Məhsul tapılmadı':'Товар не найден','Məhsullar yenidən səbətə əlavə edildi':'Товары снова добавлены в корзину','Mənim yerim':'Моё местоположение',
  'Nağd':'Наличные','Nağd ödəniş (çatdırılmada)':'Оплата наличными (при доставке)','Nəticə tapılmadı':'Ничего не найдено','Ombanın ən geniş nöqtəsindən dairəvi ölçü.':'Измерение по самой широкой точке бёдер.',
  'Ölçü bələdçisi':'Гид по размерам','Ölçü cədvəlləri qadın və kişi üçün fərqlidir — tövsiyələr buna əsaslanır.':'Таблицы размеров отличаются для женщин и мужчин — рекомендации основаны на этом.','Ölçü lenti lazım deyil — bir neçə seçimlə fərdi ölçünü dəqiqləşdir.':'Сантиметр не нужен — уточните свой размер за несколько шагов.','Ölçü profilin':'Ваш профиль размеров','Ölçü:':'Размер:',
  'Ölçülərimi əlavə et':'Добавить мои размеры','Ölçülərinizi əlavə edin →':'Добавьте свои размеры →','Redaktə':'Изменить','Rəng:':'Цвет:','Rəy göndərilmədi':'Отзыв не отправлен',
  'Rəy yalnız bu məhsulu alıb çatdırılmasını aldıqdan sonra yazıla bilər.':'Отзыв можно оставить только после покупки и получения этого товара.','Rəy yazmaq üçün hesabınıza daxil olun və məhsulu alın.':'Чтобы оставить отзыв, войдите в аккаунт и купите товар.',
  'Seçilmiş məhsullarda 20%-dək endirim. Fürsəti qaçırma.':'Скидка до 20% на избранные товары. Не упусти момент.','Seçilmiş ölçü stokda yoxdur — başqa ölçü seçin.':'Выбранного размера нет в наличии — выберите другой.','Seçilmişlər boşdur':'Избранное пусто','Seçilmişlərdən silindi':'Удалено из избранного','Seçilmişlərə əlavə edildi':'Добавлено в избранное',
  'Serverlə əlaqə yoxdur':'Нет связи с сервером','Serverlə əlaqə yoxdur. Backend işləyirmi?':'Нет связи с сервером. Backend запущен?','Sifariş qəbul edildi!':'Заказ принят!','Sifariş ləğv edildi':'Заказ отменён','Sifariş nömrəniz:':'Номер вашего заказа:','Sifariş və kampaniya məlumatlarını e-poçtla al':'Получать информацию о заказах и акциях по email','Sifarişi ləğv et':'Отменить заказ',
  'Sinə':'Грудь','Sinə (sm)':'Грудь (см)','Şalvar':'Брюки','Şəxsi tövsiyələr':'Персональные рекомендации','Şəkil yüklənmədi':'Изображение не загружено','Şifrəni bərpa et':'Восстановить пароль','Şort':'Шорты',
  'Tamamla və yadda saxla':'Завершить и сохранить','Tez-tez verilən suallar':'Часто задаваемые вопросы','Təxmini çatdırılma: 2–3 iş günü ərzində':'Примерная доставка: в течение 2–3 рабочих дней','Təxmini ölçün':'Ваш примерный размер','Ümumi':'Итого','Ünvan tapılır…':'Поиск адреса…',
  'Yadda saxlanılır…':'Сохранение…','Yandan baxanda qarın nahiyən necədir?':'Как выглядит ваш живот сбоку?','Yaş':'Возраст','Yaşın':'Ваш возраст','YENİ KOLLEKSİYA':'НОВАЯ КОЛЛЕКЦИЯ','Yenidən cəhd et':'Повторить','Yenidən göndər':'Отправить снова','Yükləmə xətası':'Ошибка загрузки','Yüklənir…':'Загрузка…',
  'Google ilə giriş tezliklə əlavə olunacaq. Hələlik email ilə daxil olun.':'Вход через Google скоро появится. Пока войдите по email.',
});
Object.assign(I18N.en, {
  '← Geri qayıt':'← Go back','← Saxlanmış ünvanlardan seç':'← Choose from saved addresses','+ Yeni ünvan':'+ New address','+ Yeni ünvan əlavə et':'+ Add new address',
  '♀ Qadın':'♀ Female','♂ Kişi':'♂ Male','⚠ Backend serverə qoşulmaq mümkün olmadı.':'⚠ Could not connect to the server.',
  '✅ Sifarişi təsdiqləyin':'✅ Confirm your order','✏️ Redaktə et':'✏️ Edit','✏️ Yenidən keç':'✏️ Redo','✓ Yadda saxlanıldı':'✓ Saved',
  '💳 Ödəniş':'💳 Payment','💳 Ödəniş üsulu':'💳 Payment method','📍 Çatdırılma':'📍 Delivery','📍 Çatdırılma ünvanı':'📍 Delivery address','📏 Ölçülərim':'📏 My sizes',
  '📏 Necə ölçməli? (sadə ölçü lenti kifayətdir)':'📏 How to measure? (a simple tape is enough)','🚚 Çatdırılma məlumatı':'🚚 Delivery info','🚚 Sifariş izləmə':'🚚 Order tracking',
  'axtarılır…':'searching…','Axtarış nəticələri':'Search results','AI ÖLÇÜ':'AI SIZE','AI ölçü hesablanır…':'Calculating AI size…','AI ölçü məsləhəti':'AI size advice','AI tövsiyələri bu məlumatlara əsaslanır':'AI recommendations are based on this data',
  'Aktivləşdirmək üçün hesaba daxil olun':'Sign in to activate','Alış-verişə başla':'Start shopping','Alış-verişə başlamaq üçün geyim kataloquna keçin':'Go to the clothing catalog to start shopping',
  'Ana səhifədə "Sənin üçün seçdik" bölməsini göstər':'Show the “Picked for you” section on the home page','arıq':'slim',
  'Ayaq uzunluğun':'Your leg length','Ayaqqabı ölçü cədvəli':'Shoe size chart','Ayaqqabı ölçün':'Your shoe size','Azərbaycan':'Azerbaijan',
  'Azərbaycanın aparıcı geyim mağazaları Gardrop-da.':'Azerbaijan’s leading clothing stores on Gardrop.','Azərbaycanın multi-vendor geyim marketplace-i.':'Azerbaijan’s multi-vendor clothing marketplace.','Bakı':'Baku',
  'Başqa açar söz ilə axtarın':'Try another keyword','Bel genişliyin':'Your waist width','Bel nahiyən necədir?':'How is your waist?','Beynəlxalq INT standartı (sm ilə)':'International INT standard (in cm)',
  'Bədən ölçülərinə əsasən hər məhsul üçün uyğun ölçünü tövsiyə edirik.':'Based on your measurements we recommend the right size for each product.','Bədən siluetini və başlanğıc ölçünü bunlardan hesablayırıq.':'We calculate your body silhouette and starting size from these.','Bədənin ən incə hissəsi — təbii bel xətti.':'The narrowest part of the body — the natural waistline.',
  'Bəli, ləğv et':'Yes, cancel','Bəyəndiyiniz məhsulları seçilmişlərə əlavə edin':'Add products you like to favorites','Bilmirəm / keç':'I don’t know / skip','böyük':'large',
  'Bu əməliyyat hesab tələb edir':'This action requires an account','Bu kateqoriyada məhsul tapılmadı':'No products found in this category','Bu məhsula artıq rəy vermisiniz. Təşəkkürlər!':'You have already reviewed this product. Thank you!',
  'Bu məhsulu aldınız — təcrübənizi ulduz, şərh və şəkillə paylaşın.':'You bought this product — share a rating, comment and photo.','Bu məkanı seç':'Select this location','Bu sifarişi ləğv etmək istəyirsiniz?':'Do you want to cancel this order?','Bu ünvan profilinizə də əlavə olunacaq.':'This address will also be added to your profile.',
  'Cinsiyyət':'Gender','Cinsiyyət və bədən ölçüləri':'Gender and body measurements','Cinsiyyətin':'Your gender','Çatdırıldı':'Delivered','Çəki':'Weight','Çiyin':'Shoulders','Çiyin genişliyin':'Your shoulder width','Çiyinlərin digərləri ilə müqayisədə necədir?':'How are your shoulders compared to others?','çox iri':'very large',
  'Daxil olmağa qayıt':'Back to sign in','Dəstək':'Support','dolğun':'full','E-poçt bildirişləri':'Email notifications','Email göndərildi!':'Email sent!','Email ünvanınıza bərpa linki göndərəcəyik':'We’ll send a reset link to your email','Email və şifrəni daxil edin':'Enter email and password',
  'ENDİRİM SEZONU':'SALE SEASON','Endirimlərə bax':'View deals','EU standartı, 36–46 (etiketdəki rəqəm).':'EU standard, 36–46 (the number on the label).','ədəd':'pcs','Əlavə et':'Add','Ən çox soruşulan sualların cavabları':'Answers to the most frequently asked questions','Ətək':'Skirt',
  'geniş':'wide','Geniş':'Wide','Göndərilir…':'Sending…','Hamısı':'All','Hamısını sil':'Remove all','Hazırlanır':'Processing','Hazırlandı':'Prepared','Ləğv edildi':'Cancelled','Niyə bahadır?':'Why so expensive?','Anladım':'Got it','Pulsuz':'Free','Standart':'Standard','Ekspress':'Express','qaldı':'left','Pulsuz çatdırılmaya':'To free delivery','Hesab məlumatları':'Account details','Hesabdan çıx':'Sign out','Hələ ünvan əlavə edilməyib':'No addresses added yet','Hüquqi':'Legal',
  'Xəritədə dəyiş':'Change on map','Xəritədən məkan seç':'Pick location on map','Xəritədən seç':'Pick on map','Xəritəyə klikləyin və ya markeri sürüşdürün':'Click the map or drag the marker','Xəta baş verdi':'An error occurred','Xüsusilə üst geyimlər və şalvar üçün lazımdır.':'Especially needed for tops and trousers.',
  'İlk sifarişinizi verin':'Place your first order','incə':'slim','İptal':'Cancelled','İstifadəçi şərtlərini qəbul edin':'Please accept the terms of service','Kartla ödəniş':'Card payment','Kartla ödəniş tezliklə':'Card payment coming soon',
  'Keyfiyyətli parçalar, eleqant dizayn və AI ölçü məsləhəti bir arada.':'Quality fabrics, elegant design and AI size advice in one place.','kiçik':'small','Köynək':'Shirt','Kupon etibarsızdır':'Invalid coupon',
  'Qarın':'Belly','Qarın genişliyin':'Your belly width','qısa':'short','Qısa':'Short','orta':'medium','Orta':'Medium',
  'Lent qoltuqaltından keçərək döşün ən çıxıntılı hissəsindən dairəvi ölçülür.':'The tape passes under the arms and around the fullest part of the chest.','Ləğv et':'Cancel','Ləğv etmək üçün dəstəklə əlaqə saxlayın':'Contact support to cancel','Link göndər':'Send link',
  'Mağaza tapılmadı':'Store not found','Mağaza:':'Store:','MAĞAZALAR':'STORES','Mağazalara bax':'View stores','Məhsul silindi':'Product removed','məhsul tapıldı':'products found','Məhsul tapılmadı':'Product not found','Məhsullar yenidən səbətə əlavə edildi':'Products added to cart again','Mənim yerim':'My location',
  'Nağd':'Cash','Nağd ödəniş (çatdırılmada)':'Cash payment (on delivery)','Nəticə tapılmadı':'No results found','Ombanın ən geniş nöqtəsindən dairəvi ölçü.':'Measured around the widest point of the hips.',
  'Ölçü bələdçisi':'Size guide','Ölçü cədvəlləri qadın və kişi üçün fərqlidir — tövsiyələr buna əsaslanır.':'Size charts differ for women and men — recommendations are based on this.','Ölçü lenti lazım deyil — bir neçə seçimlə fərdi ölçünü dəqiqləşdir.':'No tape needed — refine your personal size with a few choices.','Ölçü profilin':'Your size profile','Ölçü:':'Size:',
  'Ölçülərimi əlavə et':'Add my sizes','Ölçülərinizi əlavə edin →':'Add your sizes →','Redaktə':'Edit','Rəng:':'Color:','Rəy göndərilmədi':'Review not submitted',
  'Rəy yalnız bu məhsulu alıb çatdırılmasını aldıqdan sonra yazıla bilər.':'A review can only be written after buying and receiving this product.','Rəy yazmaq üçün hesabınıza daxil olun və məhsulu alın.':'To write a review, sign in and purchase the product.',
  'Seçilmiş məhsullarda 20%-dək endirim. Fürsəti qaçırma.':'Up to 20% off selected items. Don’t miss out.','Seçilmiş ölçü stokda yoxdur — başqa ölçü seçin.':'The selected size is out of stock — choose another.','Seçilmişlər boşdur':'Favorites are empty','Seçilmişlərdən silindi':'Removed from favorites','Seçilmişlərə əlavə edildi':'Added to favorites',
  'Serverlə əlaqə yoxdur':'No connection to the server','Serverlə əlaqə yoxdur. Backend işləyirmi?':'No server connection. Is the backend running?','Sifariş qəbul edildi!':'Order received!','Sifariş ləğv edildi':'Order cancelled','Sifariş nömrəniz:':'Your order number:','Sifariş və kampaniya məlumatlarını e-poçtla al':'Receive order and promo info by email','Sifarişi ləğv et':'Cancel order',
  'Sinə':'Chest','Sinə (sm)':'Chest (cm)','Şalvar':'Trousers','Şəxsi tövsiyələr':'Personal recommendations','Şəkil yüklənmədi':'Image not uploaded','Şifrəni bərpa et':'Reset password','Şort':'Shorts',
  'Tamamla və yadda saxla':'Finish and save','Tez-tez verilən suallar':'Frequently asked questions','Təxmini çatdırılma: 2–3 iş günü ərzində':'Estimated delivery: within 2–3 business days','Təxmini ölçün':'Your estimated size','Ümumi':'Total','Ünvan tapılır…':'Finding address…',
  'Yadda saxlanılır…':'Saving…','Yandan baxanda qarın nahiyən necədir?':'How does your belly look from the side?','Yaş':'Age','Yaşın':'Your age','YENİ KOLLEKSİYA':'NEW COLLECTION','Yenidən cəhd et':'Try again','Yenidən göndər':'Resend','Yükləmə xətası':'Upload error','Yüklənir…':'Loading…',
  'Google ilə giriş tezliklə əlavə olunacaq. Hələlik email ilə daxil olun.':'Google sign-in is coming soon. For now, sign in with email.',
});
// Bölmə başlıqları + FAQ
Object.assign(I18N.ru, {
  'Top mağazalar':'Топ магазины','Sənin üçün seçdik':'Подобрано для вас','Tez-tez verilən suallar':'Часто задаваемые вопросы',
  'Biz kimik?':'Кто мы?','AI ölçü sistemi nədir?':'Что такое AI-система размеров?','Çatdırılma necə işləyir?':'Как работает доставка?','Geri qaytarma şərtləri nədir?':'Каковы условия возврата?',
  'Gardrop, Azərbaycanın çoxsatıcılı geyim marketplace-idir. Minlərlə brendin məhsullarını bir platformada toplayırıq.':'Gardrop — это мультивендорный маркетплейс одежды Азербайджана. Мы собираем товары тысяч брендов на одной платформе.',
  'Bədən ölçülərinizə əsasən hər məhsul üçün uyğun ölçünü tövsiyə edirik. Dəqiqlik 90%+ təşkil edir.':'На основе ваших мерок мы рекомендуем подходящий размер для каждого товара. Точность — 90%+.',
  'Bakı daxilindən 1-2 iş günü, regionlara 3-5 iş günü ərzində çatdırılma həyata keçirilir.':'Доставка по Баку — 1–2 рабочих дня, в регионы — 3–5 рабочих дней.',
  '14 gün ərzində istifadə edilməmiş məhsulları geri qaytara bilərsiniz.':'Неиспользованные товары можно вернуть в течение 14 дней.',
  'Sifarişlərinizi izləmək, seçilmişlər və AI ölçü məsləhəti üçün daxil olun və ya qeydiyyatdan keçin.':'Войдите или зарегистрируйтесь, чтобы отслеживать заказы, добавлять в избранное и получать AI-совет по размеру.',
});
Object.assign(I18N.en, {
  'Top mağazalar':'Top stores','Sənin üçün seçdik':'Picked for you','Tez-tez verilən suallar':'Frequently asked questions',
  'Sifarişlərinizi izləmək, seçilmişlər və AI ölçü məsləhəti üçün daxil olun və ya qeydiyyatdan keçin.':'Sign in or sign up to track orders, save favorites and get AI size advice.',
  'Biz kimik?':'Who are we?','AI ölçü sistemi nədir?':'What is the AI size system?','Çatdırılma necə işləyir?':'How does delivery work?','Geri qaytarma şərtləri nədir?':'What is the return policy?',
  'Gardrop, Azərbaycanın çoxsatıcılı geyim marketplace-idir. Minlərlə brendin məhsullarını bir platformada toplayırıq.':'Gardrop is Azerbaijan’s multi-vendor clothing marketplace. We bring products from thousands of brands onto one platform.',
  'Bədən ölçülərinizə əsasən hər məhsul üçün uyğun ölçünü tövsiyə edirik. Dəqiqlik 90%+ təşkil edir.':'Based on your body measurements we recommend the right size for each product. Accuracy is 90%+.',
  'Bakı daxilindən 1-2 iş günü, regionlara 3-5 iş günü ərzində çatdırılma həyata keçirilir.':'Delivery within Baku takes 1–2 business days, to regions 3–5 business days.',
  '14 gün ərzində istifadə edilməmiş məhsulları geri qaytara bilərsiniz.':'You can return unused products within 14 days.',
});
