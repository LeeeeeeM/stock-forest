package router

import (
	"net/http"

	"new-apps/backend/internal/handler"
	"new-apps/backend/internal/middleware"
	"new-apps/backend/internal/service"

	"github.com/gin-gonic/gin"
)

func New(
	authHandler *handler.AuthHandler,
	stockHandler *handler.StockHandler,
	watchlistHandler *handler.WatchlistHandler,
	authSvc *service.AuthService,
) *gin.Engine {
	r := gin.Default()

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/email-verification/register", authHandler.SendRegisterVerificationCode)
		auth.POST("/email-verification/forgot-password", authHandler.SendForgotPasswordVerificationCode)
		auth.POST("/email-verification/change-password", middleware.AuthRequired(authSvc), authHandler.SendChangePasswordVerificationCode)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/change-password", middleware.AuthRequired(authSvc), authHandler.ChangePassword)
		auth.GET("/me", middleware.AuthRequired(authSvc), authHandler.Me)

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
