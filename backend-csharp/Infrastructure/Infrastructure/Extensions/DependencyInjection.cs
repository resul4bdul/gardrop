        // Şəkil optimizasiyası (upload-da WebP sıxma + thumbnail) — stateless, Singleton.
-        services.AddSingleton<IImageProcessor, ImageSharpProcessor>();
+        services.AddSingleton<IImageProcessor, SkiaSharpProcessor>();
        // Köhnə şəkil backfill (bir-dəfəlik admin əməliyyatı) — DbContext-dən asılı, Scoped.
