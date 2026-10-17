using Gardrop.Core.Domain.Enums;

namespace Gardrop.Infrastructure.Persistance.Data;

/// <summary>Statik kataloq mənbəyi. Reytinq/rəy sahələri 0-dır — real rəylərdən hesablanır.</summary>
public static class CatalogSeed
{
    public static readonly string[] ClothingSizes = { "S", "M", "L", "XL", "XXL" };
    public static readonly string[] ShoeSizes = { "40", "41", "42", "43", "44" };

    // Mağaza reytinqləri seed-də 0-dır — sifariş/rəy/imtinaya görə RatingEngine hesablayır.
    public static List<Store> Stores() => new()
    {
        new() { Id = 1, Name = "BakuWear",   Rating = 0, Reviews = 0, Products = 0, City = "Bakı",     Established = 2018, Lat = 40.3777, Lng = 49.8920, Address = "28 May küç. 5, Bakı" },
        new() { Id = 2, Name = "StyleAZ",    Rating = 0, Reviews = 0, Products = 0, City = "Bakı",     Established = 2019, Lat = 40.4093, Lng = 49.8671, Address = "Nizami küç. 12, Bakı" },
        new() { Id = 3, Name = "DenimHouse", Rating = 0, Reviews = 0, Products = 0, City = "Gəncə",    Established = 2020, Lat = 40.6828, Lng = 46.3606, Address = "Atatürk pr. 40, Gəncə" },
        new() { Id = 4, Name = "UrbanAZ",    Rating = 0, Reviews = 0, Products = 0, City = "Bakı",     Established = 2017, Lat = 40.3953, Lng = 49.8822, Address = "Fəvvarələr meydanı, Bakı" },
        new() { Id = 5, Name = "ElegantAZ",  Rating = 0, Reviews = 0, Products = 0, City = "Bakı",     Established = 2016, Lat = 40.3725, Lng = 49.8350, Address = "8 Noyabr pr. 25, Bakı" },
        new() { Id = 6, Name = "FashionAZ",  Rating = 0, Reviews = 0, Products = 0, City = "Sumqayıt", Established = 2021, Lat = 40.5897, Lng = 49.6686, Address = "Sülh küç. 3, Sumqayıt" },
        new() { Id = 7, Name = "SportAZ",    Rating = 0, Reviews = 0, Products = 0, City = "Bakı",     Established = 2015, Lat = 40.4015, Lng = 49.9498, Address = "Heydər Əliyev pr. 100, Bakı" },
    };

    // Nümunə kuponlar (yalnız boş cədvələ əlavə olunur).
    public static List<Coupon> Coupons() => new()
    {
        new() { Code = "XOSGELMISEN", Type = CouponType.amount,  Value = 10, MinOrder = 100, Active = true },
        new() { Code = "YAY15",       Type = CouponType.percent, Value = 15, MinOrder = 50,  Active = true },
    };

    private static SubcategoryNode N(string name, params string[] children) =>
        new() { Name = name, Children = children.ToList() };

    // 3-səviyyəli kateqoriya ağacı — geyim marketpleysi üçün maksimal dəst.
    // Əsas kateqoriyalar: Kişi, Qadın, Uşaq, Ayaqqabı, Aksesuar.
    public static List<Category> Categories()
    {
        var cats = new List<Category>
        {
            new()
            {
                Name = "Kişi",
                Tree = new()
                {
                    N("T-shirt", "Qısaqol", "Uzunqol", "Basic", "Çaplı"),
                    N("Köynək", "Klassik", "Denim", "Flanel", "Kətan"),
                    N("Polo", "Qısaqol", "Uzunqol"),
                    N("Hoodie", "Zəncirli", "Kapüşonlu", "Oversize"),
                    N("Sviter", "Boğazlı", "V-yaxa", "Kardiqan"),
                    N("Pencək", "Blazer", "Bomber", "Gödəkçə", "Palto"),
                    N("Şalvar", "Klassik", "Karqo", "İdman", "Çino"),
                    N("Cins", "Slim", "Regular", "Skinny"),
                    N("Şort", "İdman", "Cins", "Klassik"),
                },
            },
            new()
            {
                Name = "Qadın",
                Tree = new()
                {
                    N("Paltar", "Gündəlik", "Axşam", "Yay", "Trikotaj"),
                    N("Bluz", "Klassik", "İpək", "Kətan"),
                    N("Köynək", "Klassik", "Oversize", "Denim"),
                    N("Kofta", "Kardiqan", "Sviter", "Boğazlı"),
                    N("Palto", "Yun", "Trençkot", "Ödlük"),
                    N("Ətək", "Mini", "Midi", "Maksi"),
                    N("Şalvar", "Klassik", "Palazzo", "İdman"),
                    N("Cins", "Skinny", "Mom", "Geniş"),
                    N("Şort", "Cins", "Klassik"),
                },
            },
            new()
            {
                Name = "Uşaq",
                Tree = new()
                {
                    N("Üst geyim", "T-shirt", "Köynək", "Sviter", "Ödlük"),
                    N("Alt geyim", "Şalvar", "Şort", "Ətək"),
                    N("Dəstlər", "İdman dəsti", "Yay dəsti"),
                    N("Ayaqqabı", "Krossovka", "Sandalet", "Çəkmə"),
                },
            },
            new()
            {
                Name = "Ayaqqabı",
                Tree = new()
                {
                    N("Krossovka", "İdman", "Gündəlik", "Running"),
                    N("Klassik", "Oksford", "Loafer", "Derbi"),
                    N("Çəkmə", "Qış", "Dəri", "Çelsi"),
                    N("Sandalet", "Plyaj", "Klassik"),
                    N("Dabanlı", "Stiletto", "Platforma"),
                    N("Babet", "Klassik", "Üzlü"),
                },
            },
            new()
            {
                Name = "Aksesuar",
                Tree = new()
                {
                    N("Çanta", "Çiyin", "Backpack", "Bel", "Portfel"),
                    N("Kəmər", "Dəri", "Toxuma"),
                    N("Papaq", "Beysbol", "Şapka", "Beret"),
                    N("Eynək", "Günəş", "Optik"),
                    N("Şərf", "Yun", "İpək"),
                    N("Saat", "Klassik", "Smart"),
                    N("Əlcək", "Dəri", "Trikotaj"),
                },
            },
        };

        // Flat siyahını ağacdan törət (məhsul alt-kateqoriya seçimi və geriyə-uyğunluq üçün).
        foreach (var c in cats)
            c.Subcategories = c.Tree.Select(t => t.Name).ToList();
        return cats;
    }

    private static Dictionary<string, int> SS(params (string size, int qty)[] e) =>
        e.ToDictionary(x => x.size, x => x.qty);

    private static List<string> Pics(int id, int n = 4) =>
        Enumerable.Range(1, n).Select(i => $"https://picsum.photos/seed/gd{id}{(char)('a' + i - 1)}/600/800").ToList();

    public static List<Product> Products()
    {
        var list = new List<Product>
        {
            new() { Id = 1,  Name = "Qara Sadə T-shirt", Store = "BakuWear",   StoreId = 1, Price = 44.99m, OldPrice = null, Size = "L",  Discount = null, Category = "Kişi",     Subcategory = "T-shirt", SubSubcategory = "Basic",   Gender = Gender.Male,    SizeSystem = "INT", Color = "Qara",      SizeStock = SS(("S",10),("M",15),("L",12),("XL",5)),        Material = "100% Pambıq",            Description = "Qarderobun ən əvəzolunmaz elementlərindən biri olan klassik qara t-shirt. Yumşaq pambıq parça gündəlik rahatlıq təmin edir." },
            new() { Id = 2,  Name = "Pambıq Köynək",     Store = "StyleAZ",    StoreId = 2, Price = 84,    OldPrice = 105,  Size = "XL", Discount = 20,   Category = "Kişi",     Subcategory = "Köynək",  SubSubcategory = "Klassik", Gender = Gender.Male,    SizeSystem = "INT", Color = "Ağ",        SizeStock = SS(("M",6),("L",8),("XL",4)),                   Material = "100% Pambıq",            Description = "Rəsmi və yarı-rəsmi tədbirlər üçün ideal ağ köynək. Nəfəs alan parça bütün gün təravət bəxş edir." },
            new() { Id = 3,  Name = "Slim Fit Cins",     Store = "DenimHouse", StoreId = 3, Price = 65.99m, OldPrice = null, Size = "M",  Discount = null, Category = "Kişi",     Subcategory = "Cins",    SubSubcategory = "Slim",    Gender = Gender.Male,    SizeSystem = "INT", FitType = "Slim",     Stretch = "low",  Color = "Mavi",      SizeStock = SS(("S",8),("M",12),("L",10)),                  Material = "98% Pambıq, 2% Elastan", Description = "Müasir slim fit kəsim. Elastik parça hərəkət azadlığı verir, gündəlik geyim üçün mükəmməldir." },
            new() { Id = 4,  Name = "Polo Köynək",       Store = "BakuWear",   StoreId = 1, Price = 55,    OldPrice = 70,   Size = "L",  Discount = 21,   Category = "Kişi",     Subcategory = "Polo",    SubSubcategory = "Qısaqol", Gender = Gender.Male,    SizeSystem = "INT", Color = "Yaşıl",     SizeStock = SS(("M",9),("L",7),("XL",9)),                   Material = "95% Pambıq, 5% Elastan", Description = "Klassik polo dizaynı. İdman və gündəlik geyimlər arasında mükəmməl balans." },
            new() { Id = 5,  Name = "Casual Hoodie",     Store = "UrbanAZ",    StoreId = 4, Price = 89.99m, OldPrice = null, Size = "XL", Discount = null, Category = "Kişi",     Subcategory = "Hoodie",  SubSubcategory = "Oversize",Gender = Gender.Unisex, SizeSystem = "INT", FitType = "Oversize", Stretch = "medium", Color = "Boz",       SizeStock = SS(("S",12),("M",18),("L",15),("XL",10)),       Material = "80% Pambıq, 20% Polyester", Description = "İsti və rahat hoodie. Soyuq günlər üçün ideal, yumşaq daxili tük astar ilə." },
            new() { Id = 6,  Name = "Klassik Blazer",    Store = "ElegantAZ",  StoreId = 5, Price = 145,   OldPrice = 180,  Size = "L",  Discount = 19,   Category = "Kişi",     Subcategory = "Pencək",  SubSubcategory = "Blazer",  Gender = Gender.Male,    SizeSystem = "INT", Color = "Tünd mavi", SizeStock = SS(("M",4),("L",5),("XL",3)),                   Material = "70% Yun, 30% Polyester", Description = "Eleqant kəsimli blazer. Rəsmi tədbirlər və iş geyimi üçün vazkeçilməz." },
            new() { Id = 7,  Name = "Çiçəkli Paltar",    Store = "FashionAZ",  StoreId = 6, Price = 78.99m, OldPrice = null, Size = "S",  Discount = null, Category = "Qadın",    Subcategory = "Paltar",  SubSubcategory = "Yay",     Gender = Gender.Female,   SizeSystem = "INT", Color = "Çiçəkli",   SizeStock = SS(("XS",6),("S",11),("M",10),("L",6)),         Material = "100% Viskoza",           Description = "Yay üçün yüngül çiçəkli paltar. Zərif dizayn və rahat kəsim." },
            new() { Id = 8,  Name = "Yüngül Cardigan",   Store = "StyleAZ",    StoreId = 2, Price = 62,    OldPrice = 80,   Size = "M",  Discount = 22,   Category = "Qadın",    Subcategory = "Kofta",   SubSubcategory = "Kardiqan",Gender = Gender.Female,   SizeSystem = "INT", Color = "Krem",      SizeStock = SS(("S",9),("M",10),("L",8)),                   Material = "60% Pambıq, 40% Akril",  Description = "Yumşaq və yüngül kardiqan. Mövsümlərarası geyim üçün ideal seçim." },
            new() { Id = 9,  Name = "Bej Trençkot",      Store = "ElegantAZ",  StoreId = 5, Price = 199,   OldPrice = 250,  Size = "S",  Discount = 20,   Category = "Qadın",    Subcategory = "Palto",   SubSubcategory = "Trençkot",Gender = Gender.Female,   SizeSystem = "INT", Color = "Bej",       SizeStock = SS(("XS",3),("S",4),("M",2)),                   Material = "65% Pambıq, 35% Polyester", Description = "Klassik bej trençkot. Payız üçün stil və funksionallığı birləşdirir." },
            new() { Id = 10, Name = "Uşaq Ödlük",        Store = "FashionAZ",  StoreId = 6, Price = 35.99m, OldPrice = null, Size = "M",  Discount = null, Category = "Uşaq",     Subcategory = "Üst geyim",SubSubcategory = "Ödlük",  Gender = Gender.Unisex, SizeSystem = "INT", Color = "Sarı",      SizeStock = SS(("XS",14),("S",16),("M",10)),                Material = "100% Polyester",     Description = "Uşaqlar üçün isti və yüngül ödlük. Su keçirməyən səth, rahat hərəkət." },
            new() { Id = 11, Name = "Sport Krossovka",   Store = "SportAZ",    StoreId = 7, Price = 115,   OldPrice = 145,  Size = "42", Discount = 20,   Category = "Ayaqqabı", Subcategory = "Krossovka",SubSubcategory = "İdman",  Gender = Gender.Unisex, SizeSystem = "TR",  Color = "Ağ",        SizeStock = SS(("40",8),("41",12),("42",15),("43",9),("44",4)), Material = "Tekstil və sintetik",   Description = "Yüngül və nəfəs alan idman krossovkası. Gündəlik və idman üçün mükəmməl." },
            new() { Id = 12, Name = "Dəri Oksford",      Store = "ElegantAZ",  StoreId = 5, Price = 185,   OldPrice = null, Size = "43", Discount = null, Category = "Ayaqqabı", Subcategory = "Klassik", SubSubcategory = "Oksford", Gender = Gender.Male,    SizeSystem = "TR",  Color = "Qəhvəyi",   SizeStock = SS(("41",4),("42",6),("43",3),("44",2)),        Material = "100% Təbii dəri",       Description = "Əl işi təbii dəri oksford ayaqqabı. Rəsmi geyimlər üçün klassik seçim." },
            new() { Id = 13, Name = "Klassik Şalvar",    Store = "ElegantAZ",  StoreId = 5, Price = 72,    OldPrice = 90,   Size = "40", Discount = 20,   Category = "Kişi",     Subcategory = "Şalvar",  SubSubcategory = "Klassik", Gender = Gender.Male,    SizeSystem = "TR",  FitType = "Regular",  Stretch = "low",  Color = "Antrasit",  SizeStock = SS(("38",6),("40",9),("42",7),("44",4),("46",2)), Material = "65% Pambıq, 33% Polyester, 2% Elastan", Description = "Rəqəm ölçülü klassik kişi şalvarı. İş və rəsmi geyim üçün rahat regular kəsim." },
        };

        foreach (var p in list)
        {
            // Ölçü siyahısı və ümumi stok per-ölçü stokdan törədilir.
            if (p.SizeStock.Count > 0)
            {
                p.Sizes = p.SizeStock.Keys.ToList();
                p.Stock = p.SizeStock.Values.Sum();
            }
            // Yalnız demo placeholder (picsum). Real şəkillər admin/mağaza tərəfindən öz
            // upload pipeline-ı ilə yüklənir (IStorageService Local/S3 — bax A.2/A.3).
            if (p.ImageUrls.Count == 0) p.ImageUrls = Pics(p.Id);
            p.Images = p.ImageUrls.Count;
            // Reytinq və rəy əl ilə yazılmır.
            p.Rating = 0;
            p.Reviews = 0;
        }
        return list;
    }

    // Rəylər seed-də yoxdur — istifadəçilər özləri yazır (reytinq/rəy defolt 0).
    public static List<Review> Reviews() => new();
}
