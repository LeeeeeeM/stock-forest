package main

import (
	"log"

	"new-apps/backend/internal/config"
	"new-apps/backend/internal/database"
	"new-apps/backend/internal/handler"
	"new-apps/backend/internal/repository"
	"new-apps/backend/internal/router"
	"new-apps/backend/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config failed: %v", err)
	}

	gin.SetMode(cfg.GinMode)

	db, err := database.Connect(cfg.DSN())
	if err != nil {
		log.Fatalf("connect database failed: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	evRepo := repository.NewEmailVerificationRepository(db)
	watchlistRepo := repository.NewWatchlistRepository(db)
	authSvc := service.NewAuthService(
		userRepo,
		cfg.JWTAccessSecret,
		cfg.JWTRefreshSecret,
		cfg.AccessExpireMin,
		cfg.RefreshExpireH,
	)
	mailSvc := service.NewMailService(cfg.ResendAPIKey, cfg.ResendFrom)
	verificationSvc := service.NewVerificationService(mailSvc, evRepo, userRepo)
	captchaSvc := service.NewCaptchaService()
	quoteSvc := service.NewQuoteService()
	authHandler := handler.NewAuthHandler(authSvc, userRepo, verificationSvc, captchaSvc)
	stockHandler := handler.NewStockHandler(quoteSvc)
	watchlistHandler := handler.NewWatchlistHandler(watchlistRepo, quoteSvc)
	r := router.New(authHandler, stockHandler, watchlistHandler, authSvc)
	if err := r.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		log.Fatalf("set trusted proxies failed: %v", err)
	}

	log.Printf("server running on :%s", cfg.AppPort)
	if err := r.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("run server failed: %v", err)
	}
}
