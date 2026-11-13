package audit

import (
	"log"

	"bfc-backend/middleware"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
)

type Entry struct {	
	Menu string
	Activity string
	Description string
}

func Log(c *gin.Context, db *repository.DB, e Entry) {
	if db == nil {
		return
	}

	userIDVal, hasUserID := c.Get(middleware.CtxUserID)
	usernameVal, hasUsername := c.Get(middleware.CtxUsername)
	roleVal, _ := c.Get(middleware.CtxRole)
	if !hasUserID || !hasUsername {
		
		log.Printf("[audit.Log] dibatalkan: context tidak punya user_id/username (menu=%q activity=%q)", e.Menu, e.Activity)
		return
	}

	userID, _ := userIDVal.(int)
	username, _ := usernameVal.(string)
	role, _ := roleVal.(string)
	if userID == 0 || username == "" {
		log.Printf("[audit.Log] dibatalkan: userID/username kosong setelah type assertion (menu=%q activity=%q)", e.Menu, e.Activity)
		return
	}

	if err := db.CreateActivityLog(c, &models.ActivityLog{
		UserID:      userID,
		UserName:    username,
		Role:        role,
		Menu:        e.Menu,
		Activity:    e.Activity,
		Description: e.Description,
		Method:      c.Request.Method,
		Endpoint:    c.FullPath(),
		IPAddress:   c.ClientIP(),
		UserAgent:   c.Request.UserAgent(),
	}); err != nil {
	
		log.Printf("[audit.Log] gagal menyimpan activity log (menu=%q activity=%q user=%q): %v",
			e.Menu, e.Activity, username, err)
	}
}
