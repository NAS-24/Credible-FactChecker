# backend/credibility_sources.py
# FINAL, UNIFIED SOURCE FOR MVP TAGGING LOGIC

# --- EXPLANATION TEMPLATE (The core legal defense for the pop-up) ---
_IFCN_EXPLANATION = (
    "<div style='"
    "border: 2px solid #38A169; " #/* Darker green border */
    "background-color: #F0FFF4; " #/* Very light green background shade */
    "padding: 15px; "
    "border-radius: 10px; " #/* Rounded corners */
    "font-family: Arial, sans-serif; "
    "color: #1A365D;" #/* Dark text color */
    "box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);' " #/* Soft modern shadow */
    ">"
    "<h3 style='margin-top: 0; color: #10B981; font-size: 14px; font-weight: 700; display: flex; align-items: center;'>"
    "✅ IFCN CERTIFIED PUBLISHER"
    "</h3>"
    "<p style='margin-bottom: 10px; font-size: 13px; line-height: 1.4;'>"
    "This publisher has successfully completed a rigorous, non-partisan audit against the **IFCN Code of Principles**, ensuring commitment to accuracy and fairness."
    "</p>"
    "<div style='border-top: 1px solid #E2E8F0; padding-top: 8px; font-size: 11px;'>"
    "<strong>Authority Source:</strong> <a href='https://ifcncodeofprinciples.poynter.org/signatories' target='_blank' style='color: #2B6CB0; text-decoration: none;'>Official IFCN Signatories Directory</a>"
    "</div>"
    "</div>"
)

_REPUTABLE_TEMPLATE = (
    "<div style='border: 2px solid #2563EB; background-color: #E3F2FD; padding: 15px; border-radius: 10px; font-family: Arial, sans-serif; color: #1E40AF; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);'>"
    "<h3 style='margin-top: 0; color: #3B82F6; font-size: 14px; font-weight: 700; display: flex; align-items: center;'>"
    "⭐ HIGH EDITORIAL STANDARD: {SOURCE_NAME}</h3>"
    "<p style='margin-bottom: 10px; font-size: 13px; line-height: 1.4;'>"
    "{SPECIFIC_REASON}"
    "</p>"
    "<div style='border-top: 1px solid #BFDBFE; padding-top: 8px; font-size: 11px;'>"
    "<strong>Authority Source:</strong> <a href='{LINK}' target='_blank' style='color: #1E40AF; text-decoration: underline; font-weight: bold;'>View Editorial Standards / History</a>"
    "</div>"
    "</div>"
)

_UNSCORED_EXPLANATION = (
    "<div style='border: 2px solid #D1D5DB; background-color: #F9FAFB; padding: 15px; border-radius: 10px; font-family: Arial, sans-serif; color: #4B5563; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);'>"
    
    # Title
    "<h3 style='margin-top: 0; color: #6B7280; font-size: 14px; font-weight: 700; display: flex; align-items: center;'>⚪ PUBLISHER NOT VETTED</h3>"
    
    # Main Explanation
    "<p style='margin-bottom: 10px; font-size: 13px; line-height: 1.4;'>This source has <strong>not been assessed</strong> by the Credible project or official fact-checking bodies. We assign no judgment regarding its reliability.</p>"
    
    # Call to Action
    "<div style='border-top: 1px solid #E5E7EB; padding-top: 8px; font-size: 12px; font-style: italic;'>"
    "You may click the <strong>Verify Claim</strong> button to run a live Agent check on specific sentences (Phase 4)."
    "</div>"
    "</div>"
)


# --- FINAL CONSOLIDATED DATA DICTIONARY ---
# This structure is complete and ready for your final main.py implementation.
MVP_CREDIBILITY_DATA = {
    # Data is transformed from your provided list (all are now VERIFIED)
    
    # # Example Legacy Publisher Data (to be added to the final dictionary)
    # "thehindu.com":       {"tag_ui": "REPUTABLE", "tag_reason": "Legacy Publisher (1878), High Editorial Standard"},
    # "bbc.com":            {"tag_ui": "REPUTABLE", "tag_reason": "Public Service Broadcaster, High Editorial Standard"},


    # --- IFCN CERTIFIED FACT-CHECKERS (Tag: VERIFIED) ---
    "delfi.lv":           {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Latvia"},
    "abs-cbn.com":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Philippines"},
    "factuel.afp.com":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "France"},
    "ansa.it":            {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Italy"},
    "apa.at":             {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Austria"},
    "hibrid.info":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Kosovo"},
    "africacheck.org":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "South Africa"},
    "sciencepresse.qc.ca": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Canada"},
    "akhbarmeter.com":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Egypt"},
    "animalpolitico.com": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Mexico"},
    "annielab.org":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Hong Kong"},
    "annir.org":          {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Libya"},
    "aosfatos.org":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Brazil"},
    "aap.com.au":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Australia"},
    "balobakicheck.org":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Congo, the Democratic Republic of the"},
    "bncheck.org":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Tunisia"},
    "boomlive.in":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "br.de":              {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Germany"},
    "beamreports.net":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Sudan"},
    "bic.report":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Czech Republic"},
    "boliviaverifica.bo": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Bolivia, Plurinational State of"},
    "correctiv.org":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Germany"},
    "cablecheck.org":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Nigeria"},
    "cazadoresdefakenews.info": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Venezuela, Bolivarian Republic of"},
    "liputan6.com":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Indonesia"},
    "checkyourfact.com":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "chequeado.com":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Argentina"},
    "civilnet.am":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Armenia"},
    "colombiacheck.com":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Colombia"},
    "cotejo.info":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Venezuela, Bolivarian Republic of"},
    "melo.delfi.lt":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Lithuania"},
    "datacheck.org":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Cameroon"},
    "faktikontroll.delfi.ee": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Estonia"},
    "demagog.org.pl":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Poland"},
    "demagog.cz":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Czech Republic"},
    "demagog.sk":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Slovakia"},
    "dw.com":             {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Germany"},
    "digiteye.in":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "doblecheck.cr":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Costa Rica"},
    "dogrula.org":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Turkey"},
    "dogrulukpayi.com":   {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Turkey"},
    "efe.com":            {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Spain"},
    "ecuadorchequea.com": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Ecuador"},
    "efectococuyo.com":   {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Venezuela, Bolivarian Republic of"},
    "univision.com":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "elezafact.org":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Congo, the Democratic Republic of the"},
    "ellinikahoaxes.gr":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Greece"},
    "estadao.com.br":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Brazil"},
    "factly.in":          {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "factcheckzimbabwe.org": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Zimbabwe"},
    "fip.am":             {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Armenia"},
    "factcheck.ge":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Georgia"},
    "factcheck.org":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "factcheckafrica.org": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Nigeria"},
    "factcheckni.org":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United Kingdom"},
    "factcrescendo.com":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "ghanufact.com":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Ghana"},
    "facta.news":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Italy"},
    "factchecklab.org":   {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Hong Kong"},
    "factcheck.kz":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Kazakhstan"},
    "factchequeado.com":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "factnameh.com":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Canada"},
    "fakenews.rs":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Serbia"},
    "fakt-yoxla.az":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Azerbaijan"},
    "faktisk.no":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Norway"},
    "faktograf.hr":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Croatia"},
    "faktoje.al":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Albania"},
    "fastcheck.cl":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Chile"},
    "firstcheck.in":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "france24.com":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "France"},
    "fullfact.org":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United Kingdom"},
    "przeciwdzialamydezinformacji.pl": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Poland"},
    "funky.ro":           {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Romania"},
    "gwaramedia.com":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Ukraine"},
    "greecefactcheck.gr": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Greece"},
    "greenefact.pt":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Portugal"},
    "hkbu.edu.hk":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Hong Kong"},
    "haqcheck.org":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Ethiopia"},
    "internewskosova.com": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Kosovo"},
    "infact.press":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Japan"},
    "indiatoday.in":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "infoveritas.es":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Spain"},
    "istinomer.rs":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Serbia"},
    "istinomer.ba":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Bosnia and Herzegovina"},
    "jtbc.co.kr":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Korea, Republic of"},
    "factcheckcenter.jp": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Japan"},
    "knack.be":           {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Belgium"},
    "kallkritikbyran.se": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Sweden"},
    "lasillavacia.com":   {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Colombia"},
    "lakmusz.hu":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Hungary"},
    "leadstories.com":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "lighthousejournalism.com": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "litmus.in":          {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Japan"},
    "lvmediacenter.org":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Liberia"},
    "lupa.news":          {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Brazil"},
    "maharatfoundation.org": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Lebanon"},
    "malaespinacheck.cl": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Chile"},
    "maldita.es":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Spain"},
    "manoramaonline.com": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "mediawise.org":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "medicaldialogues.in": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "metamorphosis.org.mk": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "North Macedonia"},
    "mygopen.com":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Taiwan"},
    "mythdetector.ge":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Georgia"},
    "nepalfactcheck.org": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Nepal"},
    "newsmobile.in":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "newschecker.in":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "newsmeter.in":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "newtral.es":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Spain"},
    "observador.pt":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Portugal"},
    "ocote.com.gt":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Guatemala"},
    "open.online":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Italy"},
    "ostro.si":           {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Slovenia"},
    "pa.media":           {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United Kingdom"},
    "kompas.com":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Indonesia"},
    "publico.pt":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Portugal"},
    "pagellapolitica.it": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Italy"},
    "kashif.ps":          {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Palestinian Territory, Occupied"},
    "15min.lt":           {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Lithuania"},
    "pesacheck.org":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Kenya"},
    "pigafirimbi.co.ke":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Kenya"},
    "politifact.com":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "poligrafo.pt":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Portugal"},
    "prawda.org.pl":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Poland"},
    "ptcij.org":          {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Nigeria"},
    "pti.in":             {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "pressone.ph":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Philippines"},
    "provereno.media":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Estonia"},
    "rappler.com":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Philippines"},
    "raskrikavanje.rs":   {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Serbia"},
    "raskrinkavanje.ba":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Bosnia and Herzegovina"},
    "raskrinkavanje.me":  {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Montenegro"},
    "rebaltica.lv":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Latvia"},
    "reuters.com":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "sciencefeedback.co": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "France"},
    "snopes.com":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "stopfake.org":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Ukraine"},
    "stopfals.md":        {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Moldova, Republic of"},
    "suara.com":          {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Indonesia"},
    "telemundo.com":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "thip.media":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "thelallantop.com":   {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "twnch.org.tw":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Taiwan"},
    "tech4peace.org":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Iraq"},
    "telugupost.com":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "tempo.co":           {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Indonesia"},
    "teyit.org":          {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Turkey"},
    "thecanadianpress.com": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Canada"},
    "thedispatch.com":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "thejournal.ie":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Ireland"},
    "thequint.com":       {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "tims.tw":            {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Taiwan"},
    "washingtonpost.com": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "thewhistle.co.il":   {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Israel"},
    "tirto.id":           {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Indonesia"},
    "tjekdet.dk":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Denmark"},
    "uol.com.br":         {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Brazil"},
    "vrt.be":             {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Belgium"},
    "verafiles.org":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Philippines"},
    "larepublica.pe":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Peru"},
    "verify-sy.com":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Turkey"},
    "viralcheck.pt":      {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Portugal"},
    "vishvasnews.com":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "India"},
    "voxukraine.org":     {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Ukraine"},
    "wisconsinwatch.org": {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "United States"},
    "dpa.com":            {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Germany"},
    "ladiaria.com.uy":    {"tag_ui": "VERIFIED", "tag_reason": _IFCN_EXPLANATION, "region": "Uruguay"}
}

# ==============================================================================
# 2. RAW DATA: REPUTABLE PUBLISHERS (Specific Details)
# ==============================================================================

REPUTABLE_RAW_DATA = {
    # --- INTERNATIONAL NEWS AGENCIES (The Source of Record) ---
    "reuters.com": {
        "name": "Reuters",
        "link": "https://www.thomsonreuters.com/en/about-us/trust-principles.html",
        "reason": "Global news agency (est. 1851) bound by the Trust Principles of independence, integrity, and freedom from bias."
    },
    "apnews.com": {
        "name": "Associated Press (AP)",
        "link": "https://www.ap.org/about/news-values-and-principles/",
        "reason": "Independent global news cooperative (est. 1846), serving as a primary source of factual reporting for thousands of newsrooms."
    },
    "afp.com": {
        "name": "Agence France-Presse (AFP)",
        "link": "https://www.afp.com/en/agency/afp-charter",
        "reason": "One of the world's oldest news agencies (est. 1835), governed by a charter guaranteeing its absolute independence."
    },
    "bloomberg.com": {
        "name": "Bloomberg News",
        "link": "https://www.bloomberg.com/company/values/",
        "reason": "A premier global provider of business and financial news, known for data-driven accuracy."
    },
    "dpa-international.com": {
        "name": "Deutsche Presse-Agentur (dpa)",
        "link": "https://www.dpa.com/en/company/about-dpa",
        "reason": "Germany's leading news agency, statutorily mandated to report impartially and independent of state influence."
    },

    # --- MAJOR INDIAN PUBLISHERS (Legacy & High Standard) ---
    "thehindu.com": {
        "name": "The Hindu",
        "link": "https://www.thehindu.com/values/",
        "reason": "India's newspaper of record (est. 1878), internationally recognized for editorial independence and rigorous fact-checking."
    },
    "indianexpress.com": {
        "name": "The Indian Express",
        "link": "https://indianexpress.com/about-us/",
        "reason": "Renowned for its 'Journalism of Courage' (est. 1932) and a history of investigative reporting against censorship."
    },
    "timesofindia.indiatimes.com": {
        "name": "The Times of India",
        "link": "https://timesofindia.indiatimes.com/aboutus",
        "reason": "The world's largest-selling English-language daily (est. 1838), a primary source of record for Indian national news."
    },
    "hindustantimes.com": {
        "name": "Hindustan Times",
        "link": "https://www.hindustantimes.com/about-us",
        "reason": "A flagship Indian newspaper founded in 1924, historically associated with the independence movement."
    },
    "pti.in": {
        "name": "Press Trust of India (PTI)",
        "link": "https://www.ptinews.com/about-us",
        "reason": "India's largest news agency (est. 1947), a non-profit cooperative supplying factual feed to mainstream Indian media."
    },
    "ndtv.com": {
        "name": "NDTV",
        "link": "https://www.ndtv.com/convergence/ndtv/corporatepage/index.aspx",
        "reason": "A pioneer in Indian television news (est. 1988), recognized for setting broadcast journalism standards in the region."
    },
    "indiatoday.in": {
        "name": "India Today",
        "link": "https://www.indiatoday.in/about-us",
        "reason": "One of India's leading news magazines and networks, featuring a dedicated fact-check unit."
    },
    "theprint.in": {
        "name": "ThePrint",
        "link": "https://theprint.in/about-us/",
        "reason": "A digital-first news organization known for factual, non-partisan reporting on politics and policy."
    },
    "scroll.in": {
        "name": "Scroll.in",
        "link": "https://scroll.in/about",
        "reason": "An independent digital news publication noted for in-depth reportage and cultural analysis."
    },

    # --- GLOBAL LEGACY PUBLISHERS (US/UK/EU) ---
    "bbc.com": {
        "name": "BBC News",
        "link": "https://www.bbc.co.uk/editorialguidelines/",
        "reason": "The world's oldest national broadcaster, legally mandated to provide impartial public service broadcasting."
    },
    "nytimes.com": {
        "name": "The New York Times",
        "link": "https://www.nytco.com/company/standards-ethics/",
        "reason": "A US newspaper of record (est. 1851) with over 130 Pulitzer Prizes, known for rigorous investigative journalism."
    },
    "washingtonpost.com": {
        "name": "The Washington Post",
        "link": "https://www.washingtonpost.com/policies-and-standards/",
        "reason": "A major US newspaper of record (est. 1877), famous for the Pentagon Papers and Watergate investigations."
    },
    "theguardian.com": {
        "name": "The Guardian",
        "link": "https://www.theguardian.com/info/2015/aug/05/the-guardians-editorial-code",
        "reason": "Owned by the Scott Trust to guarantee editorial independence; known for high-impact investigative journalism."
    },
    "ft.com": {
        "name": "Financial Times",
        "link": "https://aboutus.ft.com/en-gb/editorial-code/",
        "reason": "An international business newspaper of record (est. 1888), recognized for data accuracy and market analysis."
    },
    "economist.com": {
        "name": "The Economist",
        "link": "https://www.economist.com/help/about-us",
        "reason": "A weekly newspaper (est. 1843) offering authoritative insight and opinion on international news and economics."
    },
    "dw.com": {
        "name": "Deutsche Welle",
        "link": "https://www.dw.com/en/about-dw/profile/s-30688",
        "reason": "Germany's international broadcaster, providing independent news in 32 languages."
    },
    "france24.com": {
        "name": "France 24",
        "link": "https://www.france24.com/en/about-us",
        "reason": "A French state-owned international news network broadcasting globally with a mission of diversity and debate."
    },
    "aljazeera.com": {
        "name": "Al Jazeera",
        "link": "https://network.aljazeera.net/en/about-us/code-of-ethics",
        "reason": "A major global news organization based in Qatar, known for extensive coverage of the Middle East and Global South."
    },

    # --- SCIENCE & SPECIALIZED (High Rigor) ---
    "nature.com": {
        "name": "Nature",
        "link": "https://www.nature.com/nature/about",
        "reason": "One of the world's most cited scientific journals (est. 1869), publishing peer-reviewed research."
    },
    "scientificamerican.com": {
        "name": "Scientific American",
        "link": "https://www.scientificamerican.com/page/about-scientific-american/",
        "reason": "The oldest continuously published monthly magazine in the US (est. 1845), focused on expert science reporting."
    },
    "nationalgeographic.com": {
        "name": "National Geographic",
        "link": "https://www.nationalgeographic.com/pages/topic/about-us",
        "reason": "A world leader in geography, cartography, and exploration reporting since 1888."
    }
}

# ---------------------------------------------------------------------------
# 3. DATA MERGE LOGIC (The Final Step)
# ---------------------------------------------------------------------------

# We iterate through the REPUTABLE_RAW_DATA to generate the HTML 
# and add these domains to the main MVP_CREDIBILITY_DATA dictionary.

for domain, data in REPUTABLE_RAW_DATA.items():
    # 1. Inject the specific data into the Blue Box Template
    explanation = _REPUTABLE_TEMPLATE.replace("{SOURCE_NAME}", data["name"]) \
                                     .replace("{SPECIFIC_REASON}", data["reason"]) \
                                     .replace("{LINK}", data["link"])
    
    # 2. Add this entry to the main dictionary
    # (This safely adds Reuters, BBC, etc. alongside the IFCN entries)
    MVP_CREDIBILITY_DATA[domain] = {
        "tag_ui": "REPUTABLE",
        "tag_reason": explanation
    }
    
DEFAULT_UNSCORED_REASON = _UNSCORED_EXPLANATION
# Now MVP_CREDIBILITY_DATA contains BOTH the IFCN sites and the Reputable sites.