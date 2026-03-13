import { useState, useRef } from "react";

const PATTERNS = [
  { key: "chochBos", label: "CHoCH / BOS", desc: "市場構造の転換・ブレイク" },
  { key: "ob", label: "OB オーダーブロック", desc: "大口の注文が集まる価格帯" },
  { key: "liquiditySweep", label: "Liquidity Sweep", desc: "流動性の狩り" },
  { key: "eqhEql", label: "EQH / EQL", desc: "等価高値・等価安値" },
  { key: "qm", label: "QM (Quasimodo)", desc: "クォータームーブ" },
  { key: "sbrRbs", label: "SBR / RBS", desc: "サポート→レジスタンス転換" },
  { key: "mss", label: "MSS", desc: "マーケットストラクチャーシフト" },
  { key: "turtleSoup", label: "タートルスープ", desc: "偽ブレイクからの反転" },
];

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "Daily"];

export default function ChartAnalyzer() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageType, setImageType] = useState("image/png");
  const [timeframe, setTimeframe] = useState("15m");
  const [pair, setPair] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageType(file.type || "image/png");
    const url = URL.createObjectURL(file);
    setImage(url);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, imageType, timeframe, pair }),
      });

      const data = await response.json();

      if (data.error) {
        setError("APIエラー: " + data.error);
        return;
      }

      if (!data.text) {
        setError("レスポンスが空でした。もう一度試してみて！");
        return;
      }

      const parsed = JSON.parse(data.text);
      setResult(parsed);
    } catch (e) {
      setError("エラー: " + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const dirColor = result?.direction === "BUY" ? "#22c55e" : result?.direction === "SELL" ? "#ef4444" : "#f59e0b";
  const entryColor = result?.entryPoint?.direction === "LONG" ? "#22c55e" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: "#07090f", color: "#cbd5e1", fontFamily: "'Courier New', monospace", padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #0d1117 0%, #07090f 100%)", borderBottom: "1px solid #1e2a3a", padding: "20px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#f59e0b", marginBottom: 4 }}>SMC × CRT</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "#f1f5f9" }}>AI CHART ANALYZER</h1>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>チャートをアップロードしてAI分析を実行（Powered by Gemini）</div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px" }}>
        {/* Upload */}
        <div
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${dragOver ? "#f59e0b" : image ? "#22c55e44" : "#1e2a3a"}`,
            borderRadius: 8, padding: "24px", textAlign: "center",
            cursor: "pointer", marginBottom: 16, transition: "all 0.2s",
            background: dragOver ? "#f59e0b08" : "transparent",
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          {image ? (
            <div>
              <img src={image} alt="chart" style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 6, objectFit: "contain" }} />
              <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>タップで画像を変更</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 13, color: "#475569" }}>チャートのスクショをドラッグ or タップしてアップロード</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>PNG / JPG 対応</div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={{ background: "#0f1420", border: "1px solid #1e2a3a", borderRadius: 8, padding: "16px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", marginBottom: 12 }}>SETTINGS</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>時間足</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {TIMEFRAMES.map(tf => (
                  <button key={tf} onClick={() => setTimeframe(tf)} style={{
                    padding: "5px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer",
                    background: timeframe === tf ? "#f59e0b22" : "transparent",
                    border: `1px solid ${timeframe === tf ? "#f59e0b" : "#1e2a3a"}`,
                    color: timeframe === tf ? "#f59e0b" : "#475569",
                    fontFamily: "'Courier New', monospace",
                  }}>{tf}</button>
                ))}
              </div>
            </div>
            <div style={{ width: 130 }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>通貨ペア（任意）</div>
              <input value={pair} onChange={e => setPair(e.target.value)} placeholder="例: USDJPY" style={{
                width: "100%", background: "#0a0e1a", border: "1px solid #1e2a3a",
                borderRadius: 4, padding: "6px 8px", color: "#cbd5e1",
                fontSize: 12, fontFamily: "'Courier New', monospace", boxSizing: "border-box",
              }} />
            </div>
          </div>
        </div>

        {/* Analyze button */}
        <button onClick={analyze} disabled={!imageBase64 || analyzing} style={{
          width: "100%", padding: "14px", marginBottom: 20,
          background: !imageBase64 ? "#1e2a3a" : analyzing ? "#f59e0b11" : "linear-gradient(135deg, #f59e0b22, #f59e0b08)",
          border: `1px solid ${!imageBase64 ? "#1e2a3a" : "#f59e0b66"}`,
          borderRadius: 6, fontSize: 13, letterSpacing: 2,
          color: !imageBase64 ? "#334155" : "#f59e0b",
          cursor: !imageBase64 || analyzing ? "not-allowed" : "pointer",
          fontFamily: "'Courier New', monospace",
        }}>
          {analyzing ? "⟳ AI分析中..." : "⚡ AI分析を実行"}
        </button>

        {error && (
          <div style={{ background: "#ef444415", border: "1px solid #ef444433", borderRadius: 8, padding: "14px", marginBottom: 16, fontSize: 12, color: "#ef4444" }}>⚠ {error}</div>
        )}

        {/* Results */}
        {result && (
          <div>
            <div style={{ background: "#0f1420", border: `1px solid ${dirColor}44`, borderRadius: 8, padding: "20px", marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", marginBottom: 10 }}>MARKET DIRECTION</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: dirColor, letterSpacing: 4, textShadow: `0 0 30px ${dirColor}88` }}>
                {result.direction === "BUY" ? "📈 BUY" : result.direction === "SELL" ? "📉 SELL" : "⚖ NEUTRAL"}
              </div>
              <div style={{ marginTop: 12, height: 6, background: "#1e2a3a", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${result.confidence}%`, background: `linear-gradient(90deg, ${dirColor}88, ${dirColor})`, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: dirColor, marginTop: 6 }}>信頼度 {result.confidence}%</div>
            </div>

            <div style={{ background: "#0f1420", border: "1px solid #1e2a3a", borderRadius: 8, padding: "16px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", marginBottom: 8 }}>MARKET SUMMARY</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{result.summary}</div>
            </div>

            <div style={{ background: "#0f1420", border: "1px solid #1e2a3a", borderRadius: 8, padding: "16px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", marginBottom: 12 }}>PATTERN DETECTION</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PATTERNS.map(p => {
                  const found = result.patterns?.[p.key]?.found;
                  const detail = result.patterns?.[p.key]?.detail;
                  return (
                    <div key={p.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 6, background: found ? "#22c55e08" : "#0a0e1a", border: `1px solid ${found ? "#22c55e33" : "#1a2332"}` }}>
                      <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: 4, background: found ? "#22c55e22" : "#1e2a3a", border: `1px solid ${found ? "#22c55e" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: found ? "#22c55e" : "#334155" }}>
                        {found ? "✓" : "–"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: found ? "#f1f5f9" : "#475569", fontWeight: found ? 700 : 400 }}>{p.label}</div>
                        {found && detail && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{detail}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {result.entryPoint && (
              <div style={{ background: "#0f1420", border: `1px solid ${entryColor}44`, borderRadius: 8, padding: "16px", marginBottom: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", marginBottom: 12 }}>ENTRY PROPOSAL</div>
                <div style={{ display: "inline-block", background: entryColor + "22", border: `1px solid ${entryColor}66`, borderRadius: 4, padding: "4px 14px", fontSize: 13, color: entryColor, letterSpacing: 2, marginBottom: 14, fontWeight: 900 }}>
                  {result.entryPoint.direction === "LONG" ? "📈 LONG" : "📉 SHORT"}
                </div>
                {[
                  { label: "エントリーゾーン", value: result.entryPoint.zone, color: entryColor },
                  { label: "損切り（SL）", value: result.entryPoint.stopLoss, color: "#ef4444" },
                  { label: "利確（TP）", value: result.entryPoint.takeProfit, color: "#22c55e" },
                  { label: "根拠", value: result.entryPoint.reasoning, color: "#94a3b8" },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: item.color, lineHeight: 1.6 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: "#1e2a3a22", border: "1px solid #1e2a3a", borderRadius: 6, padding: "10px 14px", fontSize: 10, color: "#475569", lineHeight: 1.6 }}>
              ⚠ AI分析は参考情報です。実際のトレードは必ず自身で判断してください。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
