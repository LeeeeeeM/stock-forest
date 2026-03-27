package i18n

import "github.com/gin-gonic/gin"

func ErrorJSON(c *gin.Context, status int, code string) {
	lang := ResolveLanguage(c.GetHeader("Accept-Language"))
	c.JSON(status, gin.H{
		"code":    code,
		"message": Message(lang, code),
	})
}
