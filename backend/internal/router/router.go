package router

import (
	"net/http"

	"github.com/LeeeeeeM/stock-forest/backend/internal/handler"
	"github.com/LeeeeeeM/stock-forest/backend/internal/middleware"
	"github.com/LeeeeeeM/stock-forest/backend/internal/service"

	"github.com/gin-gonic/gin"
)

func New(
	authHandler *handler.AuthHandler,
	stockHandler *handler.StockHandler,
	watchlistHandler *handler.WatchlistHandler,
	authSvc *service.AuthService,
) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.GET("/captcha", authHandler.GetCaptcha)
		auth.POST("/email-verification/register", authHandler.SendRegisterVerificationCode)
		auth.POST("/email-verification/forgot-password", authHandler.SendForgotPasswordVerificationCode)
		auth.POST("/email-verification/change-password", middleware.AuthRequired(authSvc), authHandler.SendChangePasswordVerificationCode)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/change-password", middleware.AuthRequired(authSvc), authHandler.ChangePassword)
		auth.GET("/me", middleware.AuthRequired(authSvc), authHandler.Me)
		auth.GET("/profile", middleware.AuthRequired(authSvc), authHandler.Profile)

		api.GET("/stocks/search", stockHandler.Search)
		api.GET("/stocks/quotes", stockHandler.Quotes)

		watch := api.Group("/watchlist", middleware.AuthRequired(authSvc))
		watch.GET("", watchlistHandler.List)
		watch.GET("/grouped", watchlistHandler.Grouped)
		watch.POST("", watchlistHandler.Create)
		watch.DELETE("/:id", watchlistHandler.Delete)
		watch.GET("/quotes", watchlistHandler.Quotes)
		watch.GET("/quotes/grouped", watchlistHandler.GroupedQuotes)
	}

	return r
}
