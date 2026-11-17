package auth

import "regexp"

var (
	hasLetter = regexp.MustCompile(`[A-Za-z]`)
	hasDigit  = regexp.MustCompile(`[0-9]`)
)

func ValidatePassword(pw string) (bool, string) {
	if len(pw) < 6 {
		return false, "Password minimal 6 karakter"
	}
	if !hasLetter.MatchString(pw) {
		return false, "Password harus mengandung huruf"
	}
	if !hasDigit.MatchString(pw) {
		return false, "Password harus mengandung angka"
	}
	return true, ""
}

