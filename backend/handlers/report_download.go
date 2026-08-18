// backend/handlers/report_download_handler.go
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"bfc-backend/audit"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
)

type ReportDownloadHandler struct {
	db *repository.DB
}

func NewReportDownloadHandler(db *repository.DB) *ReportDownloadHandler {
	return &ReportDownloadHandler{db: db}
}

// getKeys returns all keys from a map for debugging
func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// getKeysFromMapString returns all keys from map[string]map[string]interface{}
func getKeysFromMapString(m map[string]map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// formatFloat2 - format angka ke 2 desimal
func formatFloat2(val interface{}) float64 {
	if val == nil {
		return 0
	}
	switch v := val.(type) {
	case float64:
		return math.Round(v*100) / 100
	case float32:
		return math.Round(float64(v)*100) / 100
	case int:
		return float64(v)
	case int64:
		return float64(v)
	default:
		return 0
	}
}

// formatFloat3 - format angka ke 3 desimal
func formatFloat3(val interface{}) float64 {
	if val == nil {
		return 0
	}
	switch v := val.(type) {
	case float64:
		return math.Round(v*1000) / 1000
	case float32:
		return math.Round(float64(v)*1000) / 1000
	case int:
		return float64(v)
	case int64:
		return float64(v)
	default:
		return 0
	}
}

// generateDocxViaNode memanggil service Node.js untuk generate DOCX
func (h *ReportDownloadHandler) generateDocxViaNode(templatePath string, data map[string]interface{}) ([]byte, error) {
	fmt.Printf("📄 Generating DOCX from template: %s\n", templatePath)
	fmt.Printf("📊 Data keys: %v\n", getKeys(data))

	payload := map[string]interface{}{
		"templatePath": templatePath,
		"data":         data,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal payload: %w", err)
	}

	resp, err := http.Post("http://localhost:3001/generate-docx", "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("gagal terhubung ke docx-service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("docx-service error (status %d): %s", resp.StatusCode, string(body))
	}

	return io.ReadAll(resp.Body)
}

// calculateBKValues - hitung nilai material BK secara manual
func (h *ReportDownloadHandler) calculateBKValues(product *models.BKProduct, inputSisaMinor float64) []float64 {
	if product == nil || len(product.Materials) == 0 {
		return []float64{}
	}

	values := make([]float64, len(product.Materials))

	var d4 float64 = 1.0
	for _, m := range product.Materials {
		if m.MaterialIndex == 1 {
			d4 = m.QtyPerSachet
			break
		}
	}

	for i, m := range product.Materials {
		if m.MaterialIndex == 1 {
			values[i] = inputSisaMinor
		} else if m.MaterialIndex == 0 {
			values[i] = (inputSisaMinor / d4) * m.QtyPerSachet
		} else if m.MaterialIndex == 2 {
			values[i] = (inputSisaMinor / d4) * m.QtyPerSachet
		} else {
			var e4 float64 = 1.0
			var qtyIndex2 float64 = 0
			for _, mm := range product.Materials {
				if mm.MaterialIndex == 2 {
					e4 = mm.QtyPerSachet
					qtyIndex2 = mm.QtyPerSachet
					break
				}
			}
			e5 := (inputSisaMinor / d4) * qtyIndex2
			values[i] = (e5 / e4) * m.QtyPerSachet
		}
	}

	return values
}

// ============================================================
// PREPARE BK DATA - DENGAN RANGE HASIL PERHITUNGAN
// ============================================================
func (h *ReportDownloadHandler) prepareBKData(c *gin.Context, kodeProduk string, report *models.BKReport) (map[string]interface{}, error) {
	fmt.Printf("📦 Preparing BK data for product: %s\n", kodeProduk)

	product, err := h.db.GetBKProductFullByKode(c, kodeProduk)
	if err != nil {
		return nil, fmt.Errorf("get product: %w", err)
	}

	data := make(map[string]interface{})

	tanggalProduksi := report.TglPembuatan.Format("02-01-2006")

	// ============================================================
	// DATA UMUM
	// ============================================================
	data["no_batch"] = report.NoBatch
	data["tanggal_produksi"] = tanggalProduksi
	data["tgl_pembuatan"] = tanggalProduksi
	data["tanggal"] = tanggalProduksi
	data["bobot_total"] = formatFloat2(report.BobotTotal)
	data["input_sisa_minor"] = formatFloat2(report.InputSisaMinor)
	data["kode_produk"] = product.KodeProduk
	data["nama_produk"] = product.NamaProduk

	data["bk_no_batch"] = report.NoBatch
	data["bk_tanggal_produksi"] = tanggalProduksi
	data["bk_tanggal"] = tanggalProduksi
	data["bk_tgl_pembuatan"] = tanggalProduksi
	data["bk_bobot_total"] = formatFloat2(report.BobotTotal)
	data["bk_input_sisa_minor"] = formatFloat2(report.InputSisaMinor)
	data["bk_kode_produk"] = product.KodeProduk
	data["bk_nama_produk"] = product.NamaProduk

	// ============================================================
	// PARSE DETAIL JSON
	// ============================================================
	var detail map[string]interface{}
	var materialValues []float64

	if report.DetailJSON != "" {
		if err := json.Unmarshal([]byte(report.DetailJSON), &detail); err == nil {
			if vals, ok := detail["values"].([]interface{}); ok {
				materialValues = make([]float64, len(vals))
				for i, v := range vals {
					if val, ok := v.(float64); ok {
						materialValues[i] = val
					}
				}
				fmt.Printf("✅ BK Values from 'values': %v\n", materialValues)
			} else if vals, ok := detail["material_values"].([]interface{}); ok {
				materialValues = make([]float64, len(vals))
				for i, v := range vals {
					if val, ok := v.(float64); ok {
						materialValues[i] = val
					}
				}
				fmt.Printf("✅ BK Values from 'material_values': %v\n", materialValues)
			} else {
				if mats, ok := detail["materials"].([]interface{}); ok {
					materialValues = make([]float64, len(mats))
					for i, m := range mats {
						if mat, ok := m.(map[string]interface{}); ok {
							if val, ok := mat["hasil"].(float64); ok {
								materialValues[i] = val
							} else if val, ok := mat["hasil_batching"].(float64); ok {
								materialValues[i] = val
							} else if val, ok := mat["value"].(float64); ok {
								materialValues[i] = val
							}
						}
					}
					fmt.Printf("✅ BK Values from 'materials': %v\n", materialValues)
				}
			}
		}
	}

	if len(materialValues) == 0 {
		fmt.Printf("⚠️ No values found in detail, calculating manually...\n")
		materialValues = h.calculateBKValues(product, report.InputSisaMinor)
		fmt.Printf("✅ Manual values: %v\n", materialValues)
	}

	// ============================================================
	// DATA MATERIAL - DENGAN RANGE HASIL PERHITUNGAN
	// Range Min = Material Value - range_min
	// Range Max = Material Value - range_max
	// ============================================================
	materialsData := []map[string]interface{}{}
	for idx, m := range product.Materials {
		prefix := fmt.Sprintf("mat_%d_", idx)

		var hasil float64
		if idx < len(materialValues) {
			hasil = formatFloat2(materialValues[idx])
		} else {
			hasil = 0
		}

		// ✅ FIX: Range Min = Material Value - range_min
		// ✅ FIX: Range Max = Material Value - range_max
		var rangeMin, rangeMax float64
		if idx < len(materialValues) {
			rangeMin = formatFloat2(materialValues[idx] - m.RangeMin)
			rangeMax = formatFloat2(materialValues[idx] - m.RangeMax)
		} else {
			rangeMin = formatFloat2(0 - m.RangeMin)
			rangeMax = formatFloat2(0 - m.RangeMax)
		}

		qty := formatFloat2(m.QtyPerSachet)

		// Dengan prefix bk_
		data["bk_"+prefix+"range_min"] = rangeMin
		data["bk_"+prefix+"range_max"] = rangeMax
		data["bk_"+prefix+"kode"] = m.KodeMaterial
		data["bk_"+prefix+"qty"] = qty
		data["bk_"+prefix+"hasil"] = hasil

		// Tanpa prefix
		data[prefix+"range_min"] = rangeMin
		data[prefix+"range_max"] = rangeMax
		data[prefix+"kode"] = m.KodeMaterial
		data[prefix+"qty"] = qty
		data[prefix+"hasil"] = hasil

		materialsData = append(materialsData, map[string]interface{}{
			"index":          idx,
			"kode_material":  m.KodeMaterial,
			"qty_per_sachet": qty,
			"range_min":      rangeMin,
			"range_max":      rangeMax,
			"hasil":          hasil,
		})

		fmt.Printf("📊 BK Material %d: %s, Range Min: %.2f, Range Max: %.2f\n", idx, m.KodeMaterial, rangeMin, rangeMax)
	}
	data["materials"] = materialsData

	// ============================================================
	// DATA RENDEMEN
	// ============================================================
	rendemenData := []map[string]interface{}{}
	for idx, r := range product.Rendemen {
		persen := formatFloat2(r.Persen * 100)
		total := formatFloat2((persen / 100) * report.BobotTotal)

		rendemenData = append(rendemenData, map[string]interface{}{
			"persen":      persen,
			"total":       total,
			"persentase":  persen,
		})

		prefix := fmt.Sprintf("bk_rendemen_%d_", idx)
		data[prefix+"total"] = total
		data[prefix+"persentase"] = persen
		data[prefix+"persen"] = persen

		data[fmt.Sprintf("rendemen_%d_total", idx)] = total
		data[fmt.Sprintf("rendemen_%d_persentase", idx)] = persen
	}
	data["rendemen"] = rendemenData

	// Data rendemen individual untuk akses langsung
	if len(product.Rendemen) >= 1 {
		data["bk_rendemen_0_total"] = rendemenData[0]["total"]
		data["bk_rendemen_0_persentase"] = rendemenData[0]["persentase"]
	}
	if len(product.Rendemen) >= 2 {
		data["bk_rendemen_1_total"] = rendemenData[1]["total"]
		data["bk_rendemen_1_persentase"] = rendemenData[1]["persentase"]
	}
	if len(product.Rendemen) >= 3 {
		data["bk_rendemen_2_total"] = rendemenData[2]["total"]
		data["bk_rendemen_2_persentase"] = rendemenData[2]["persentase"]
	}
	if len(product.Rendemen) >= 4 {
		data["bk_rendemen_3_total"] = rendemenData[3]["total"]
		data["bk_rendemen_3_persentase"] = rendemenData[3]["persentase"]
	}
	if len(product.Rendemen) >= 5 {
		data["bk_rendemen_4_total"] = rendemenData[4]["total"]
		data["bk_rendemen_4_persentase"] = rendemenData[4]["persentase"]
	}

	fmt.Printf("✅ BK Data prepared: %d materials, %d rendemen\n", len(materialsData), len(rendemenData))
	return data, nil
}

// ============================================================
// PREPARE BO DATA (untuk nanti kalau dipakai)
// ============================================================
func (h *ReportDownloadHandler) prepareBOData(c *gin.Context, kodeProduk string, report *models.BOReport) (map[string]interface{}, error) {
	fmt.Printf("📦 Preparing BO data for product: %s\n", kodeProduk)

	product, err := h.db.GetBOProduct(c, kodeProduk)
	if err != nil {
		return nil, fmt.Errorf("get product: %w", err)
	}

	data := make(map[string]interface{})

	tanggalProduksi := report.TglPembuatan.Format("02-01-2006")

	// Data umum
	data["no_batch"] = report.NoBatch
	data["tanggal_produksi"] = tanggalProduksi
	data["tgl_pembuatan"] = tanggalProduksi
	data["tanggal"] = tanggalProduksi
	data["kesimpulan"] = report.Kesimpulan
	data["bobot_total"] = formatFloat2(report.BobotTotal)

	// Dengan prefix bo_
	data["bo_no_batch"] = report.NoBatch
	data["bo_tanggal_produksi"] = tanggalProduksi
	data["bo_tanggal"] = tanggalProduksi
	data["bo_tgl_pembuatan"] = tanggalProduksi
	data["bo_kesimpulan"] = report.Kesimpulan
	data["bo_bobot_total"] = formatFloat2(report.BobotTotal)

	var detail map[string]interface{}
	if report.DetailJSON != "" {
		if err := json.Unmarshal([]byte(report.DetailJSON), &detail); err != nil {
			detail = make(map[string]interface{})
		} else {
			if val, ok := detail["nilai_tertinggi"]; ok {
				data["nilai_tertinggi"] = formatFloat3(val)
				data["bo_nilai_tertinggi"] = formatFloat3(val)
			}
		}
	} else {
		detail = make(map[string]interface{})
	}

	materialMap := make(map[string]map[string]interface{})

	for _, m := range product.Materials {
		key := ""
		label := strings.ToLower(strings.TrimSpace(m.Label))
		kode := strings.ToUpper(strings.TrimSpace(m.KodeMaterial))

		switch {
		case strings.Contains(label, "sod") ||
			strings.Contains(label, "sodbic") ||
			strings.Contains(label, "bicarbonate") ||
			kode == "2AS006000J" ||
			strings.Contains(kode, "2AS"):
			key = "sodbic"
		case strings.Contains(label, "minor") ||
			kode == "XEGM1" ||
			strings.Contains(kode, "XEG"):
			key = "minor"
		case strings.Contains(label, "citric") ||
			strings.Contains(label, "asam") ||
			kode == "2AC006000J" ||
			strings.Contains(kode, "2AC"):
			key = "citric"
		case strings.Contains(label, "gula") ||
			strings.Contains(label, "sugar") ||
			strings.Contains(kode, "GULA"):
			key = "gula"
		default:
			key = fmt.Sprintf("mat%d", len(materialMap))
		}

		materialMap[key] = map[string]interface{}{
			"kode_material": m.KodeMaterial,
			"label":         m.Label,
			"target_kg":     m.TargetKg,
		}
	}

	if detail != nil {
		materials, ok := detail["materials"].([]interface{})
		if ok {
			for _, m := range materials {
				mat, ok := m.(map[string]interface{})
				if !ok {
					continue
				}

				label := strings.ToLower(strings.TrimSpace(mat["label"].(string)))
				kode := strings.ToUpper(strings.TrimSpace(mat["kode_material"].(string)))

				key := ""
				switch {
				case strings.Contains(label, "sod") ||
					strings.Contains(label, "sodbic") ||
					strings.Contains(label, "bicarbonate") ||
					kode == "2AS006000J" ||
					strings.Contains(kode, "2AS"):
					key = "sodbic"
				case strings.Contains(label, "minor") ||
					kode == "XEGM1" ||
					strings.Contains(kode, "XEG"):
					key = "minor"
				case strings.Contains(label, "citric") ||
					strings.Contains(label, "asam") ||
					kode == "2AC006000J" ||
					strings.Contains(kode, "2AC"):
					key = "citric"
				case strings.Contains(label, "gula") ||
					strings.Contains(label, "sugar") ||
					strings.Contains(kode, "GULA"):
					key = "gula"
				default:
					continue
				}

				if val, ok := materialMap[key]; ok {
					val["hasil_batching"] = mat["hasil_batching"]
					val["perbandingan"] = mat["perbandingan"]
					val["ratio"] = mat["ratio"]
					val["target_baru"] = mat["target_baru"]
					val["tambahan_reproses"] = mat["tambahan_reproses"]
				}
			}
		}
	}

	// Set data ke placeholder BO
	if val, ok := materialMap["sodbic"]; ok {
		data["bo_perbandingan_sodbic"] = formatFloat3(val["perbandingan"])
		data["bo_ratio_sodbic"] = formatFloat3(val["ratio"])
		data["bo_target_sodbic"] = formatFloat2(val["target_kg"])
		data["bo_target_baru_sodbic"] = formatFloat2(val["target_baru"])
		data["bo_tambahan_sodbic"] = formatFloat2(val["tambahan_reproses"])
		data["bo_hasil_batching_sodbic"] = formatFloat2(val["hasil_batching"])

		data["perbandingan_sodbic"] = formatFloat3(val["perbandingan"])
		data["ratio_sodbic"] = formatFloat3(val["ratio"])
		data["target_sodbic"] = formatFloat2(val["target_kg"])
		data["target_baru_sodbic"] = formatFloat2(val["target_baru"])
		data["tambahan_sodbic"] = formatFloat2(val["tambahan_reproses"])
		data["hasil_batching_sodbic"] = formatFloat2(val["hasil_batching"])
	}

	if val, ok := materialMap["minor"]; ok {
		data["bo_perbandingan_minor"] = formatFloat3(val["perbandingan"])
		data["bo_ratio_minor"] = formatFloat3(val["ratio"])
		data["bo_target_minor"] = formatFloat2(val["target_kg"])
		data["bo_target_baru_minor"] = formatFloat2(val["target_baru"])
		data["bo_tambahan_minor"] = formatFloat2(val["tambahan_reproses"])
		data["bo_hasil_batching_minor"] = formatFloat2(val["hasil_batching"])

		data["perbandingan_minor"] = formatFloat3(val["perbandingan"])
		data["ratio_minor"] = formatFloat3(val["ratio"])
		data["target_minor"] = formatFloat2(val["target_kg"])
		data["target_baru_minor"] = formatFloat2(val["target_baru"])
		data["tambahan_minor"] = formatFloat2(val["tambahan_reproses"])
		data["hasil_batching_minor"] = formatFloat2(val["hasil_batching"])
	}

	if val, ok := materialMap["citric"]; ok {
		data["bo_perbandingan_citric"] = formatFloat3(val["perbandingan"])
		data["bo_ratio_citric"] = formatFloat3(val["ratio"])
		data["bo_target_citric"] = formatFloat2(val["target_kg"])
		data["bo_target_baru_citric"] = formatFloat2(val["target_baru"])
		data["bo_tambahan_citric"] = formatFloat2(val["tambahan_reproses"])
		data["bo_hasil_batching_citric"] = formatFloat2(val["hasil_batching"])

		data["perbandingan_citric"] = formatFloat3(val["perbandingan"])
		data["ratio_citric"] = formatFloat3(val["ratio"])
		data["target_citric"] = formatFloat2(val["target_kg"])
		data["target_baru_citric"] = formatFloat2(val["target_baru"])
		data["tambahan_citric"] = formatFloat2(val["tambahan_reproses"])
		data["hasil_batching_citric"] = formatFloat2(val["hasil_batching"])
	}

	if val, ok := materialMap["gula"]; ok {
		data["bo_perbandingan_gula"] = formatFloat3(val["perbandingan"])
		data["bo_ratio_gula"] = formatFloat3(val["ratio"])
		data["bo_target_gula"] = formatFloat2(val["target_kg"])
		data["bo_target_baru_gula"] = formatFloat2(val["target_baru"])
		data["bo_tambahan_gula"] = formatFloat2(val["tambahan_reproses"])
		data["bo_hasil_batching_gula"] = formatFloat2(val["hasil_batching"])

		data["perbandingan_gula"] = formatFloat3(val["perbandingan"])
		data["ratio_gula"] = formatFloat3(val["ratio"])
		data["target_gula"] = formatFloat2(val["target_kg"])
		data["target_baru_gula"] = formatFloat2(val["target_baru"])
		data["tambahan_gula"] = formatFloat2(val["tambahan_reproses"])
		data["hasil_batching_gula"] = formatFloat2(val["hasil_batching"])
	}

	materialsData := []map[string]interface{}{}
	for _, m := range product.Materials {
		matData := map[string]interface{}{
			"kode_material": m.KodeMaterial,
			"label":         m.Label,
			"target_kg":     formatFloat2(m.TargetKg),
		}

		if detail != nil {
			materials, ok := detail["materials"].([]interface{})
			if ok {
				for _, dm := range materials {
					d, ok := dm.(map[string]interface{})
					if !ok {
						continue
					}
					if d["kode_material"] == m.KodeMaterial {
						matData["hasil_batching"] = formatFloat2(d["hasil_batching"])
						matData["perbandingan"] = formatFloat3(d["perbandingan"])
						matData["ratio"] = formatFloat3(d["ratio"])
						matData["target_baru"] = formatFloat2(d["target_baru"])
						matData["tambahan_reproses"] = formatFloat2(d["tambahan_reproses"])
						break
					}
				}
			}
		}

		materialsData = append(materialsData, matData)
	}
	data["materials"] = materialsData

	return data, nil
}

// ============================================================
// DOWNLOAD BK ONLY - POST /api/reports/download
// ============================================================

type DownloadReportRequest struct {
	KodeProduk string `json:"kode_produk" binding:"required"`
	BKReportID int    `json:"bk_report_id" binding:"required"`
}

func (h *ReportDownloadHandler) DownloadReportByType(c *gin.Context) {
	var req DownloadReportRequest
	var err error

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("❌ Invalid request: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid: " + err.Error()})
		return
	}

	fmt.Printf("📥 Downloading BK Report - Produk: %s, BK_ID: %d\n",
		req.KodeProduk, req.BKReportID)

	if req.BKReportID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Pilih report BK"})
		return
	}

	// 1. Ambil BK report
	bkReport, err := h.db.GetBKReportByID(c, req.BKReportID)
	if err != nil {
		fmt.Printf("❌ BK Report not found: ID=%d, error=%v\n", req.BKReportID, err)
		c.JSON(http.StatusNotFound, gin.H{"message": "BK Report tidak ditemukan"})
		return
	}
	fmt.Printf("✅ BK Report found: %s\n", bkReport.NoBatch)

	// 2. Ambil template
	template, err := h.db.GetReportTemplate(c, req.KodeProduk)
	if err != nil {
		fmt.Printf("❌ Template not found: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{
			"message":   "Template DOCX untuk produk " + req.KodeProduk + " belum diupload admin",
			"kode_prod": req.KodeProduk,
		})
		return
	}
	fmt.Printf("✅ Template found: %s\n", template.FilePath)

	if _, err := os.Stat(template.FilePath); os.IsNotExist(err) {
		fmt.Printf("❌ File not found: %s\n", template.FilePath)
		c.JSON(http.StatusNotFound, gin.H{
			"message":   "File template tidak ditemukan di server",
			"file_path": template.FilePath,
		})
		return
	}

	// 3. Siapkan data BK
	data, err := h.prepareBKData(c, req.KodeProduk, bkReport)
	if err != nil {
		fmt.Printf("❌ Prepare BK data error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal memproses data report",
			"error":   err.Error(),
		})
		return
	}

	// 4. Tambahkan data tambahan
	data["kode_produk"] = req.KodeProduk
	data["nama_produk"] = bkReport.NamaProduk
	data["created_by"] = bkReport.CreatedByName
	data["tanggal_download"] = time.Now().Format("02-01-2006 15:04:05")

	fmt.Printf("📊 Total data keys: %d\n", len(data))

	// 5. Generate DOCX
	docxBytes, err := h.generateDocxViaNode(template.FilePath, data)
	if err != nil {
		fmt.Printf("❌ Generate DOCX error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal generate file report",
			"error":   err.Error(),
		})
		return
	}

	fmt.Printf("✅ DOCX generated, size: %d bytes\n", len(docxBytes))

	// 6. Kirim file
	filename := fmt.Sprintf("report_BK_%s_%s.docx", req.KodeProduk, bkReport.NoBatch)
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes)

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Report",
		Activity:    "Download Report Batch Khusus",
		Description: fmt.Sprintf("Download report BK untuk produk %s, batch %s", req.KodeProduk, bkReport.NoBatch),
	})
}

// ============================================================
// DOWNLOAD GABUNGAN BO + BK (tetap ada untuk nanti)
// ============================================================

type CombinedReportRequest struct {
	KodeProduk string `json:"kode_produk" binding:"required"`
	BOReportID int    `json:"bo_report_id"`
	BKReportID int    `json:"bk_report_id"`
}

func (h *ReportDownloadHandler) DownloadCombinedReport(c *gin.Context) {
	var req CombinedReportRequest
	var err error

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("❌ Invalid request: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid: " + err.Error()})
		return
	}

	fmt.Printf("📥 Downloading Combined Report - Produk: %s, BO_ID: %d, BK_ID: %d\n",
		req.KodeProduk, req.BOReportID, req.BKReportID)

	if req.BOReportID == 0 && req.BKReportID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Pilih minimal 1 report (BO atau BK)"})
		return
	}

	var boReport *models.BOReport
	if req.BOReportID > 0 {
		boReport, err = h.db.GetBOReportByID(c, req.BOReportID)
		if err != nil {
			fmt.Printf("❌ BO Report not found: ID=%d\n", req.BOReportID)
			c.JSON(http.StatusNotFound, gin.H{"message": "BO Report tidak ditemukan"})
			return
		}
		fmt.Printf("✅ BO Report found: %s\n", boReport.NoBatch)
	}

	var bkReport *models.BKReport
	if req.BKReportID > 0 {
		bkReport, err = h.db.GetBKReportByID(c, req.BKReportID)
		if err != nil {
			fmt.Printf("❌ BK Report not found: ID=%d\n", req.BKReportID)
			c.JSON(http.StatusNotFound, gin.H{"message": "BK Report tidak ditemukan"})
			return
		}
		fmt.Printf("✅ BK Report found: %s\n", bkReport.NoBatch)
	}

	template, err := h.db.GetReportTemplate(c, req.KodeProduk)
	if err != nil {
		fmt.Printf("❌ Template not found: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{
			"message":   "Template DOCX untuk produk " + req.KodeProduk + " belum diupload admin",
			"kode_prod": req.KodeProduk,
		})
		return
	}
	fmt.Printf("✅ Template found: %s\n", template.FilePath)

	if _, err := os.Stat(template.FilePath); os.IsNotExist(err) {
		fmt.Printf("❌ File not found: %s\n", template.FilePath)
		c.JSON(http.StatusNotFound, gin.H{
			"message":   "File template tidak ditemukan di server",
			"file_path": template.FilePath,
		})
		return
	}

	data := make(map[string]interface{})
	data["kode_produk"] = req.KodeProduk
	data["tanggal_download"] = time.Now().Format("02-01-2006 15:04:05")

	if boReport != nil {
		boData, err := h.prepareBOData(c, req.KodeProduk, boReport)
		if err == nil {
			for k, v := range boData {
				if strings.HasPrefix(k, "bo_") {
					data[k] = v
				} else {
					data["bo_"+k] = v
				}
				if !strings.HasPrefix(k, "bo_") && !strings.HasPrefix(k, "bk_") {
					data[k] = v
				}
			}
			data["bo_exists"] = true
			data["bo_no_batch"] = boReport.NoBatch
			data["bo_tanggal"] = boReport.TglPembuatan.Format("02-01-2006")
			data["bo_kesimpulan"] = boReport.Kesimpulan
			data["bo_bobot_total"] = formatFloat2(boReport.BobotTotal)
		}
	} else {
		data["bo_exists"] = false
		data["bo_no_batch"] = "-"
		data["bo_tanggal"] = "-"
		data["bo_kesimpulan"] = "-"
		data["bo_bobot_total"] = 0
	}

	if bkReport != nil {
		bkData, err := h.prepareBKData(c, req.KodeProduk, bkReport)
		if err == nil {
			for k, v := range bkData {
				if strings.HasPrefix(k, "bk_") {
					data[k] = v
				} else {
					data["bk_"+k] = v
				}
				if !strings.HasPrefix(k, "bo_") && !strings.HasPrefix(k, "bk_") {
					data[k] = v
				}
			}
			data["bk_exists"] = true
			data["bk_no_batch"] = bkReport.NoBatch
			data["bk_tanggal"] = bkReport.TglPembuatan.Format("02-01-2006")
			data["bk_bobot_total"] = formatFloat2(bkReport.BobotTotal)
			data["bk_input_sisa_minor"] = formatFloat2(bkReport.InputSisaMinor)
		}
	} else {
		data["bk_exists"] = false
		data["bk_no_batch"] = "-"
		data["bk_tanggal"] = "-"
		data["bk_bobot_total"] = 0
		data["bk_input_sisa_minor"] = 0
	}

	fmt.Printf("📊 Total data keys: %d\n", len(data))

	docxBytes, err := h.generateDocxViaNode(template.FilePath, data)
	if err != nil {
		fmt.Printf("❌ Generate DOCX error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal generate file report",
			"error":   err.Error(),
		})
		return
	}

	fmt.Printf("✅ DOCX generated, size: %d bytes\n", len(docxBytes))

	filename := fmt.Sprintf("report_combined_%s.docx", req.KodeProduk)
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes)

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Report",
		Activity:    "Download Combined Report",
		Description: fmt.Sprintf("Download report gabungan BO+BK untuk produk %s", req.KodeProduk),
	})
}

// ============================================================
// DOWNLOAD INDIVIDUAL (BO atau BK) - TETAP ADA
// ============================================================

func (h *ReportDownloadHandler) DownloadReport(c *gin.Context) {
	reportID, err := strconv.Atoi(c.Param("reportId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	boReport, err := h.db.GetBOReportByID(c, reportID)
	if err == nil {
		h.downloadBOReport(c, boReport)
		return
	}

	bkReport, err := h.db.GetBKReportByID(c, reportID)
	if err == nil {
		h.downloadBKReport(c, bkReport)
		return
	}

	c.JSON(http.StatusNotFound, gin.H{"message": "Report tidak ditemukan"})
}

func (h *ReportDownloadHandler) downloadBOReport(c *gin.Context, report *models.BOReport) {
	template, err := h.db.GetReportTemplate(c, report.KodeProduk)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Template DOCX untuk produk " + report.KodeProduk + " belum diupload admin"})
		return
	}
	if _, err := os.Stat(template.FilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"message": "File template tidak ditemukan"})
		return
	}

	data, err := h.prepareBOData(c, report.KodeProduk, report)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memproses data"})
		return
	}
	data["kode_produk"] = report.KodeProduk
	data["nama_produk"] = report.NamaProduk
	data["created_by"] = report.CreatedByName
	data["tanggal_download"] = time.Now().Format("02-01-2006 15:04:05")

	docxBytes, err := h.generateDocxViaNode(template.FilePath, data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal generate file"})
		return
	}

	filename := fmt.Sprintf("report_BO_%s_%s.docx", report.KodeProduk, report.NoBatch)
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes)
}

func (h *ReportDownloadHandler) downloadBKReport(c *gin.Context, report *models.BKReport) {
	template, err := h.db.GetReportTemplate(c, report.KodeProduk)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Template DOCX untuk produk " + report.KodeProduk + " belum diupload admin"})
		return
	}
	if _, err := os.Stat(template.FilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"message": "File template tidak ditemukan"})
		return
	}

	data, err := h.prepareBKData(c, report.KodeProduk, report)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memproses data"})
		return
	}
	data["kode_produk"] = report.KodeProduk
	data["nama_produk"] = report.NamaProduk
	data["created_by"] = report.CreatedByName
	data["tanggal_download"] = time.Now().Format("02-01-2006 15:04:05")

	docxBytes, err := h.generateDocxViaNode(template.FilePath, data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal generate file"})
		return
	}

	filename := fmt.Sprintf("report_BK_%s_%s.docx", report.KodeProduk, report.NoBatch)
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes)
}