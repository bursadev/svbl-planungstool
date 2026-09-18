/* eslint-disable */
// @ts-nocheck
// Generated from SVBL Planung.dc.html by dc2jsx.py - do not edit by hand.
import React from "react";
import { cssToObj, dcList, dcText, dcVal, dcStr } from "./dc-runtime";
import { Einsatzkalender } from "./einsatzkalender";

export function renderSvblPlanung(v: any) {
  return (
    <>
      <div style={{"minHeight": "100vh", "background": "var(--bg)", "color": "var(--ink)", "fontFamily": "var(--font)"}}>
        {(v.notAuthed) ? (<>
          <div data-screen-label={"Login"} style={{"minHeight": "100vh", "display": "grid", "placeItems": "center", "padding": "24px"}}>
            {"\n  "}
            <div style={{"width": "100%", "maxWidth": "400px", "display": "flex", "flexDirection": "column", "gap": "20px", "animation": "fadeUp .3s ease-out"}}>
              {"\n    "}
              <div style={{"display": "flex", "alignItems": "center", "gap": "10px"}}>
                {"\n      "}
                <div style={{"width": "28px", "height": "28px", "background": "var(--accent)", "borderRadius": "var(--r)"}}></div>
                {"\n      "}
                <div style={{"fontWeight": "600", "fontSize": "16px"}}>
                  {"SVBL Planung"}
                </div>
                {"\n      "}
                <div style={{"fontFamily": "var(--mono)", "fontSize": "11px", "color": "var(--muted)", "marginInlineStart": "auto"}}>
                  {"Swiss Logistics · Disposition"}
                </div>
                {"\n    "}
              </div>
              {"\n    "}
              <form onSubmit={v.login} style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "24px", "display": "flex", "flexDirection": "column", "gap": "14px"}}>
                {"\n      "}
                <div style={{"fontSize": "20px", "fontWeight": "600", "letterSpacing": "-.01em"}}>
                  {"Anmelden"}
                </div>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  {"\n        "}
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"E-Mail"}
                  </span>
                  {"\n        "}
                  <input type={"email"} value={dcVal(v.email, "value")} onChange={v.setEmail} placeholder={"vorname.name@svbl.ch"} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
                  {"\n      "}
                </label>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  {"\n        "}
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Passwort"}
                  </span>
                  {"\n        "}
                  <input type={"password"} value={dcVal(v.pw, "value")} onChange={v.setPw} placeholder={"••••••••"} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
                  {"\n      "}
                </label>
                {"\n      "}
                {(v.loginError) ? (<>
                  {"\n        "}
                  <div role={"alert"} style={{"fontSize": "13px", "color": "var(--bad)", "background": "var(--bad-soft)", "borderRadius": "var(--r)", "padding": "8px 10px"}}>
                    {dcText(v.loginError)}
                  </div>
                  {"\n      "}
                </>) : null}
                {"\n      "}
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "10px 14px", "fontWeight": "500", "cursor": "pointer", "transition": "transform .12s"}} className={"scp0"}>
                  {"Anmelden"}
                </button>
                {"\n      "}
                <a href={"#"} style={{"fontSize": "12px", "textAlign": "center"}}>
                  {"Passwort vergessen?"}
                </a>
                {"\n    "}
              </form>
              {"\n    "}
              <div style={{"display": "flex", "flexDirection": "column", "gap": "8px"}}>
                {"\n      "}
                <div style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                  {"Demo-Konten"}
                </div>
                {"\n      "}
                <div style={{"display": "flex", "flexWrap": "wrap", "gap": "6px"}}>
                  {"\n        "}
                  {dcList(v.demoAccounts).map((a, $index) => (<React.Fragment key={$index}>
                    {"\n          "}
                    <button type={"button"} onClick={a?.pick} style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "999px", "padding": "5px 10px", "fontSize": "12px", "cursor": "pointer", "display": "flex", "gap": "6px", "alignItems": "center"}} className={"scp1"}>
                      <span style={{"fontWeight": "500"}}>
                        {dcText(a?.role)}
                      </span>
                      <span style={{"color": "var(--muted)", "fontFamily": "var(--mono)", "fontSize": "11px"}}>
                        {dcText(a?.email)}
                      </span>
                    </button>
                    {"\n        "}
                  </React.Fragment>))}
                  {"\n      "}
                </div>
                {"\n      "}
                <div style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                  {"Identitätsanbieter austauschbar. Nur Kontodaten verlassen das Tool – keine Planungs-, Lernenden- oder Zertifikatsdaten."}
                </div>
                {"\n    "}
              </div>
              {"\n  "}
            </div>
          </div>
        </>) : null}
        {(v.authed) ? (<>
          <div style={{"display": "grid", "gridTemplateColumns": "220px minmax(0,1fr) auto", "minHeight": "100vh"}}>
            {"\n\n  "}
            <nav aria-label={"Hauptnavigation"} style={{"borderInlineEnd": "1px solid var(--line)", "background": "var(--surface)", "display": "flex", "flexDirection": "column", "padding": "16px 12px", "gap": "4px", "position": "sticky", "top": "0", "height": "100vh"}}>
              {"\n    "}
              <div style={{"display": "flex", "alignItems": "center", "gap": "8px", "padding": "4px 8px 16px"}}>
                {"\n      "}
                <div style={{"width": "22px", "height": "22px", "background": "var(--accent)", "borderRadius": "var(--r)"}}></div>
                {"\n      "}
                <div style={{"fontWeight": "600"}}>
                  {"SVBL Planung"}
                </div>
                {"\n    "}
              </div>
              {"\n    "}
              {dcList(v.nav).map((n, $index) => (<React.Fragment key={$index}>
                {"\n      "}
                {(n?.groupLabel) ? (<>
                  <div style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500", "padding": "14px 10px 4px"}}>
                    {dcText(n?.groupLabel)}
                  </div>
                </>) : null}
                {"\n      "}
                <button onClick={n?.go} aria-current={n?.current} style={cssToObj(`display:flex;align-items:center;gap:10px;text-align:start;border:0;background:${dcStr(n?.bg)};color:${dcStr(n?.color)};border-radius:var(--r);padding:8px 10px;cursor:pointer;font-weight:${dcStr(n?.weight)}`)} className={"scp2"}>
                  {"\n        "}
                  <span style={cssToObj(`width:6px;height:6px;border-radius:50%;background:${dcStr(n?.dot)}`)}></span>
                  {"\n        "}
                  <span style={{"flex": "1"}}>
                    {dcText(n?.label)}
                  </span>
                  {"\n        "}
                  {(n?.badge) ? (<>
                    <span style={{"fontFamily": "var(--mono)", "fontSize": "11px", "background": "var(--bad-soft)", "color": "var(--bad)", "borderRadius": "999px", "padding": "1px 7px"}}>
                      {dcText(n?.badge)}
                    </span>
                  </>) : null}
                  {"\n      "}
                </button>
                {"\n    "}
              </React.Fragment>))}
              {"\n    "}
              <div style={{"marginTop": "auto", "display": "flex", "flexDirection": "column", "gap": "8px", "borderTop": "1px solid var(--line)", "paddingTop": "12px"}}>
                {"\n      "}
                <div style={{"display": "flex", "alignItems": "center", "gap": "10px", "padding": "0 6px"}}>
                  {"\n        "}
                  <div style={{"width": "30px", "height": "30px", "borderRadius": "50%", "background": "var(--accent-soft)", "color": "var(--accent)", "display": "grid", "placeItems": "center", "fontSize": "12px", "fontWeight": "600", "flexShrink": "0"}}>
                    {dcText(v.userInitials)}
                  </div>
                  {"\n        "}
                  <div style={{"minWidth": "0"}}>
                    <div style={{"fontWeight": "500", "fontSize": "13px", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>
                      {dcText(v.userName)}
                    </div>
                    <div style={{"fontSize": "11px", "color": "var(--muted)"}}>
                      {dcText(v.role)}
                    </div>
                  </div>
                  {"\n      "}
                </div>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "4px", "padding": "0 6px"}}>
                  <span style={{"fontSize": "11px", "color": "var(--muted)"}}>
                    {"Rolle (Demo)"}
                  </span>
                  {"\n        "}
                  <select value={dcVal(v.role, "value")} onChange={v.setRole} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    <option>
                      {"Planung"}
                    </option>
                    <option>
                      {"Ausbilder"}
                    </option>
                  </select>
                </label>
                {"\n      "}
                <button onClick={v.logout} style={{"border": "0", "background": "none", "color": "var(--muted)", "textAlign": "start", "padding": "6px 8px", "cursor": "pointer", "borderRadius": "var(--r)", "fontSize": "13px"}} className={"scp3"}>
                  {"Abmelden"}
                </button>
                {"\n    "}
              </div>
              {"\n  "}
            </nav>
            {"\n\n  "}
            <main style={{"minWidth": "0", "display": "flex", "flexDirection": "column"}}>
              {"\n    "}
              <header style={{"display": "flex", "alignItems": "center", "gap": "12px", "padding": "14px 24px", "borderBottom": "1px solid var(--line)", "background": "var(--surface)", "position": "sticky", "top": "0", "zIndex": "5"}}>
                {"\n      "}
                <h1 style={{"margin": "0", "fontSize": "18px", "fontWeight": "600", "letterSpacing": "-.01em"}}>
                  {dcText(v.screenTitle)}
                </h1>
                {"\n      "}
                <div style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                  {dcText(v.todayLabel)}
                </div>
                {"\n      "}
                <div style={{"marginInlineStart": "auto", "display": "flex", "gap": "8px", "alignItems": "center"}}>
                  {"\n        "}
                  {(v.canEdit) ? (<>
                    <button onClick={v.toggleAssistant} aria-pressed={v.assistantOpen} style={cssToObj(`border:1px solid var(--line2);background:${dcStr(v.assistantBtnBg)};color:var(--ink);border-radius:var(--r);padding:7px 12px;cursor:pointer;display:flex;gap:8px;align-items:center`)} className={"scp2"}>
                      <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--accent)"}}></span>
                      {"Assistent"}
                    </button>
                  </>) : null}
                  {"\n      "}
                </div>
                {"\n    "}
              </header>
              {"\n\n    "}
              <div style={{"padding": "24px", "display": "flex", "flexDirection": "column", "gap": "20px", "animation": "fadeUp .25s ease-out"}} key={v.screen}>
                {"\n\n    "}
                {"\n    "}
                {(v.show?.dashboard) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Dashboard"} style={{"display": "flex", "flexDirection": "column", "gap": "20px"}}>
                    {"\n        "}
                    <div style={{"display": "flex", "gap": "8px", "flexWrap": "wrap"}}>
                      {"\n          "}
                      {dcList(v.quickActions).map((q, $index) => (<React.Fragment key={$index}>
                        {"\n            "}
                        <button onClick={q?.go} style={{"textAlign": "start", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px 16px", "display": "flex", "flexDirection": "column", "gap": "4px", "cursor": "pointer", "flex": "1 1 200px", "minWidth": "0"}} className={"scp1"}>
                          {"\n              "}
                          <span style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                            <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--accent)"}}></span>
                            <span style={{"fontWeight": "600"}}>
                              {dcText(q?.label)}
                            </span>
                          </span>
                          {"\n              "}
                          <span style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                            {dcText(q?.desc)}
                          </span>
                          {"\n            "}
                        </button>
                        {"\n          "}
                      </React.Fragment>))}
                      {"\n        "}
                    </div>
                    {"\n        "}
                    <div style={{"display": "flex", "flexDirection": "column", "gap": "10px"}}>
                      {"\n          "}
                      <h2 style={{"margin": "0", "fontSize": "15px", "fontWeight": "600"}}>
                        {"Planungsläufe"}
                      </h2>
                      {"\n          "}
                      <div style={{"display": "flex", "gap": "12px", "flexWrap": "wrap"}}>
                        {"\n            "}
                        {dcList(v.dashRuns).map((r, $index) => (<React.Fragment key={$index}>
                          {"\n              "}
                          <button onClick={r?.open} style={{"flex": "1 1 260px", "textAlign": "start", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px 16px", "cursor": "pointer", "display": "flex", "flexDirection": "column", "gap": "8px", "minWidth": "0"}} className={"scp1"}>
                            {"\n                "}
                            <span style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                              <span style={{"fontWeight": "600"}}>
                                {dcText(r?.label)}
                              </span>
                              <span style={cssToObj(`margin-inline-start:auto;font-size:12px;color:${dcStr(r?.color)}`)}>
                                {dcText(r?.status)}
                              </span>
                            </span>
                            {"\n                "}
                            <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                              {dcText(r?.meta)}
                            </span>
                            {"\n                "}
                            <span style={{"display": "flex", "gap": "4px"}}>
                              {dcList(r?.dots).map((d, $index) => (<React.Fragment key={$index}>
                                <span title={d?.title} style={cssToObj(`flex:1;height:6px;border-radius:2px;background:${dcStr(d?.color)}`)}></span>
                              </React.Fragment>))}
                            </span>
                            {"\n              "}
                          </button>
                          {"\n            "}
                        </React.Fragment>))}
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </div>
                    {"\n        "}
                    <div style={{"display": "flex", "flexDirection": "column", "gap": "10px"}}>
                      {"\n          "}
                      <div style={{"display": "flex", "gap": "8px", "alignItems": "baseline", "flexWrap": "wrap"}}>
                        <h2 style={{"margin": "0", "fontSize": "15px", "fontWeight": "600"}}>
                          {"Protokoll"}
                        </h2>
                        <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                          {"Umbesetzungen, Folgetermine und Freigaben mit ihrer Begründung"}
                        </span>
                      </div>
                      {"\n          "}
                      <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                        {"\n            "}
                        {dcList(v.autoRows).map((a, $index) => (<React.Fragment key={$index}>
                          {"\n              "}
                          <div style={{"display": "grid", "gridTemplateColumns": "8px 110px minmax(0,1.3fr) minmax(0,1fr)", "gap": "14px", "alignItems": "center", "padding": "11px 16px", "borderBottom": "1px solid var(--line)"}}>
                            {"\n                "}
                            <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(a?.color)}`)}></span>
                            {"\n                "}
                            <span style={cssToObj(`font-size:11px;letter-spacing:.04em;text-transform:uppercase;font-weight:600;color:${dcStr(a?.color)}`)}>
                              {dcText(a?.kind)}
                            </span>
                            {"\n                "}
                            <span style={{"fontSize": "13px", "textWrap": "pretty"}}>
                              {dcText(a?.text)}
                            </span>
                            {"\n                "}
                            <span style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                              {dcText(a?.why)}
                            </span>
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </React.Fragment>))}
                        {"\n            "}
                        {(v.noAuto) ? (<>
                          <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px", "textWrap": "pretty"}}>
                            {"Noch keine Einträge. Absenzen, Folgetermine und Freigaben werden hier mit Begründung protokolliert."}
                          </div>
                        </>) : null}
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </div>
                    {"\n        "}
                    {(v.hasDecisions) ? (<>
                      {"\n          "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "10px"}}>
                        {"\n            "}
                        <div style={{"display": "flex", "gap": "8px", "alignItems": "baseline", "flexWrap": "wrap"}}>
                          <h2 style={{"margin": "0", "fontSize": "15px", "fontWeight": "600"}}>
                            {"Braucht eine Entscheidung"}
                          </h2>
                          <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                            {"Fälle, die keine Regel lösen kann"}
                          </span>
                        </div>
                        {"\n            "}
                        <div style={{"background": "var(--surface)", "border": "1px solid var(--bad)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                          {"\n              "}
                          {dcList(v.decisionRows).map((d, $index) => (<React.Fragment key={$index}>
                            {"\n                "}
                            <div style={{"display": "grid", "gridTemplateColumns": "minmax(0,1.2fr) minmax(0,1fr) auto", "gap": "14px", "alignItems": "center", "padding": "12px 16px", "borderBottom": "1px solid var(--line)"}}>
                              {"\n                  "}
                              <span style={{"fontSize": "13px", "fontWeight": "500", "textWrap": "pretty"}}>
                                {dcText(d?.text)}
                              </span>
                              {"\n                  "}
                              <span style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                                {dcText(d?.why)}
                              </span>
                              {"\n                  "}
                              <button onClick={d?.run} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "6px 12px", "fontSize": "13px", "cursor": "pointer", "whiteSpace": "nowrap"}} className={"scp4"}>
                                {dcText(d?.label)}
                              </button>
                              {"\n                "}
                            </div>
                            {"\n              "}
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.hasDone) ? (<>
                      {"\n          "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                        <div style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                          {"Heute erledigt"}
                        </div>
                        {dcList(v.doneTasks).map((d, $index) => (<React.Fragment key={$index}>
                          <div style={{"display": "flex", "gap": "10px", "fontSize": "13px", "color": "var(--muted)"}}>
                            <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--ok)", "marginTop": "6px", "flexShrink": "0"}}></span>
                            <span>
                              {dcText(d)}
                            </span>
                          </div>
                        </React.Fragment>))}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.board) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Zeitplan"} style={{"display": "flex", "flexDirection": "column", "gap": "14px"}}>
                    {"\n        "}
                    <div style={{"display": "flex", "gap": "8px", "flexWrap": "wrap", "alignItems": "center"}}>
                      {"\n          "}
                      <div style={{"display": "flex", "border": "1px solid var(--line2)", "borderRadius": "var(--r)", "overflow": "hidden"}}>
                        <button onClick={v.boardSetWeek} aria-pressed={v.boardIsWeek} style={cssToObj(`border:0;padding:8px 14px;cursor:pointer;font-size:13px;background:${dcStr(v.boardWeekBg)};color:${dcStr(v.boardWeekColor)}`)}>
                          {"Wochen"}
                        </button>
                        <button onClick={v.boardSetMonth} aria-pressed={v.boardIsMonth} style={cssToObj(`border:0;border-inline-start:1px solid var(--line2);padding:8px 14px;cursor:pointer;font-size:13px;background:${dcStr(v.boardMonthBg)};color:${dcStr(v.boardMonthColor)}`)}>
                          {"Monat"}
                        </button>
                      </div>
                      {"\n          "}
                      <select value={dcVal(v.filterLoc, "value")} onChange={v.setFilterLoc} aria-label={"Standort"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                        <option value={""}>
                          {"Alle Standorte"}
                        </option>
                        <option value={"UK"}>
                          {"Nur ÜK-Standorte"}
                        </option>
                        {dcList(v.locs).map((l, $index) => (<React.Fragment key={$index}>
                          <option value={dcVal(l?.id, "value")}>
                            {dcText(l?.name)}
                          </option>
                        </React.Fragment>))}
                      </select>
                      {"\n          "}
                      <select value={dcVal(v.filterStatus, "value")} onChange={v.setFilterStatus} aria-label={"Status"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                        <option value={""}>
                          {"Alle Status"}
                        </option>
                        <option>
                          {"offen"}
                        </option>
                        <option>
                          {"geplant"}
                        </option>
                        <option>
                          {"bestätigt"}
                        </option>
                        <option>
                          {"laufend"}
                        </option>
                        <option>
                          {"Konflikt"}
                        </option>
                      </select>
                      {"\n          "}
                      <div style={{"display": "flex", "gap": "12px", "marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)", "flexWrap": "wrap"}}>
                        {"\n            "}
                        <span style={{"display": "flex", "gap": "6px", "alignItems": "center"}}>
                          <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--ok)"}}></span>
                          {"bestätigt/laufend"}
                        </span>
                        {"\n            "}
                        <span style={{"display": "flex", "gap": "6px", "alignItems": "center"}}>
                          <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--accent)"}}></span>
                          {"geplant"}
                        </span>
                        {"\n            "}
                        <span style={{"display": "flex", "gap": "6px", "alignItems": "center"}}>
                          <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--warn)"}}></span>
                          {"offen"}
                        </span>
                        {"\n            "}
                        <span style={{"display": "flex", "gap": "6px", "alignItems": "center"}}>
                          <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--bad)"}}></span>
                          {"Konflikt"}
                        </span>
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </div>
                    {"\n        "}
                    {(v.boardIsWeek) ? (<>
                      {"\n        "}
                      <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                        {"\n          "}
                        <div style={{"display": "grid", "gridTemplateColumns": "120px repeat(8,minmax(140px,1fr))", "minWidth": "1240px"}}>
                          {"\n            "}
                          <div style={{"padding": "10px 12px", "borderBottom": "1px solid var(--line)", "fontSize": "12px", "color": "var(--muted)", "position": "sticky", "left": "0", "background": "var(--surface)", "zIndex": "1"}}>
                            {"Standort"}
                          </div>
                          {"\n            "}
                          {dcList(v.weeks).map((w, $index) => (<React.Fragment key={$index}>
                            {"\n              "}
                            <div style={cssToObj(`padding:10px 12px;border-bottom:1px solid var(--line);border-inline-start:1px solid var(--line);background:${dcStr(w?.bg)}`)}>
                              <div style={{"fontWeight": "600", "fontSize": "13px"}}>
                                {"KW "}{dcText(w?.kw)}
                              </div>
                              <div style={{"fontFamily": "var(--mono)", "fontSize": "11px", "color": "var(--muted)"}}>
                                {dcText(w?.range)}
                              </div>
                            </div>
                            {"\n            "}
                          </React.Fragment>))}
                          {"\n            "}
                          {dcList(v.boardRows).map((row, $index) => (<React.Fragment key={$index}>
                            {"\n              "}
                            <div style={{"padding": "12px", "borderBottom": "1px solid var(--line)", "position": "sticky", "left": "0", "background": "var(--surface)", "display": "flex", "flexDirection": "column", "gap": "2px", "zIndex": "1"}}>
                              <span style={{"fontWeight": "500"}}>
                                {dcText(row?.name)}
                              </span>
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "11px", "color": "var(--muted)"}}>
                                {dcText(row?.meta)}
                              </span>
                            </div>
                            {"\n              "}
                            {dcList(row?.cells).map((cell, $index) => (<React.Fragment key={$index}>
                              {"\n                "}
                              <div onDragOver={cell?.over} onDrop={cell?.drop} style={cssToObj(`padding:6px;border-bottom:1px solid var(--line);border-inline-start:1px solid var(--line);display:flex;flex-direction:column;gap:6px;min-height:64px;background:${dcStr(cell?.bg)}`)}>
                                {"\n                  "}
                                {dcList(cell?.courses).map((c, $index) => (<React.Fragment key={$index}>
                                  {"\n                    "}
                                  <div draggable={v.canEdit} onDragStart={c?.drag} onClick={c?.open} role={"button"} tabIndex={"0"} onKeyDown={c?.key} style={cssToObj(`border:1px solid var(--line);border-inline-start:3px solid ${dcStr(c?.color)};border-radius:var(--r);padding:6px 8px;background:var(--surface);cursor:pointer;display:flex;flex-direction:column;gap:2px;font-size:12px;line-height:1.35`)} className={"scp5"}>
                                    {"\n                      "}
                                    <div style={{"display": "flex", "justifyContent": "space-between", "gap": "6px"}}>
                                      <span style={{"fontFamily": "var(--mono)", "fontWeight": "500"}}>
                                        {dcText(c?.code)}
                                      </span>
                                      <span style={{"color": "var(--muted)"}}>
                                        {dcText(c?.dayRange)}
                                      </span>
                                    </div>
                                    {"\n                      "}
                                    <div style={{"fontWeight": "500", "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap"}}>
                                      {dcText(c?.name)}
                                    </div>
                                    {"\n                      "}
                                    <div style={{"display": "flex", "justifyContent": "space-between", "gap": "6px"}}>
                                      <span style={cssToObj(`color:${dcStr(c?.instrColor)}`)}>
                                        {dcText(c?.instrLabel)}
                                      </span>
                                      <span style={{"fontFamily": "var(--mono)", "color": "var(--muted)"}}>
                                        {dcText(c?.enrolled)}{"/"}{dcText(c?.max)}
                                      </span>
                                    </div>
                                    {"\n                    "}
                                  </div>
                                  {"\n                  "}
                                </React.Fragment>))}
                                {"\n                "}
                              </div>
                              {"\n              "}
                            </React.Fragment>))}
                            {"\n            "}
                          </React.Fragment>))}
                          {"\n          "}
                        </div>
                        {"\n        "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.boardIsMonth) ? (<>
                      {"\n          "}
                      <div style={{"display": "flex", "gap": "8px", "alignItems": "center", "flexWrap": "wrap"}}>
                        {"\n            "}
                        <div style={{"display": "flex", "border": "1px solid var(--line2)", "borderRadius": "var(--r)", "overflow": "hidden"}}>
                          <button onClick={v.boardPrev} aria-label={"Zurück"} style={{"border": "0", "background": "var(--surface)", "padding": "6px 12px", "cursor": "pointer"}} className={"scp2"}>
                            {"‹"}
                          </button>
                          <button onClick={v.boardNext} aria-label={"Weiter"} style={{"border": "0", "borderInlineStart": "1px solid var(--line2)", "background": "var(--surface)", "padding": "6px 12px", "cursor": "pointer"}} className={"scp2"}>
                            {"›"}
                          </button>
                        </div>
                        {"\n            "}
                        <div style={{"fontWeight": "600", "fontSize": "15px"}}>
                          {dcText(v.boardMonthLabel)}
                        </div>
                        {"\n          "}
                      </div>
                      {"\n          "}
                      <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                        {"\n            "}
                        <div style={{"display": "grid", "gridTemplateColumns": "repeat(7,1fr)", "borderBottom": "1px solid var(--line)"}}>
                          {dcList(v.boardWeekdays).map((w, $index) => (<React.Fragment key={$index}>
                            <div style={{"padding": "8px 10px", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                              {dcText(w)}
                            </div>
                          </React.Fragment>))}
                        </div>
                        {"\n            "}
                        <div style={{"display": "grid", "gridTemplateColumns": "repeat(7,1fr)"}}>
                          {"\n              "}
                          {dcList(v.boardCells).map((c, $index) => (<React.Fragment key={$index}>
                            {"\n                "}
                            <div style={cssToObj(`min-height:104px;padding:6px 8px;border-bottom:1px solid var(--line);border-inline-end:1px solid var(--line);display:flex;flex-direction:column;gap:4px;background:${dcStr(c?.bg)};opacity:${dcStr(c?.opacity)}`)}>
                              {"\n                  "}
                              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "baseline"}}>
                                <span style={cssToObj(`font-family:var(--mono);font-size:12px;font-weight:${dcStr(c?.weight)};color:${dcStr(c?.color)}`)}>
                                  {dcText(c?.day)}
                                </span>
                                {(c?.kwLabel) ? (<>
                                  <span style={{"fontSize": "10px", "color": "var(--muted)"}}>
                                    {dcText(c?.kwLabel)}
                                  </span>
                                </>) : null}
                              </div>
                              {"\n                  "}
                              {dcList(c?.items).map((it, $index) => (<React.Fragment key={$index}>
                                <button onClick={it?.open} title={it?.title} style={cssToObj(`text-align:start;border:0;font-size:11px;border-radius:3px;padding:2px 6px;background:var(--surface2);color:var(--ink);border-inline-start:2px solid ${dcStr(it?.color)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer`)} className={"scp6"}>
                                  {dcText(it?.code)}{" · "}{dcText(it?.locName)}
                                </button>
                              </React.Fragment>))}
                              {"\n                "}
                            </div>
                            {"\n              "}
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                      {"Kursblöcke per Drag-and-drop in eine andere Woche oder an einen anderen Standort ziehen – die Machbarkeit wird sofort neu geprüft. Klick öffnet die Details."}
                    </div>
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.courses) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Kurse"} style={{"display": "flex", "flexDirection": "column", "gap": "14px"}}>
                    {"\n        "}
                    <div style={{"display": "flex", "gap": "8px", "alignItems": "center", "flexWrap": "wrap"}}>
                      {"\n          "}
                      <div style={{"display": "flex", "border": "1px solid var(--line2)", "borderRadius": "var(--r)", "overflow": "hidden"}}>
                        {"\n            "}
                        <button onClick={v.tabCoursesRuns} style={cssToObj(`border:0;padding:7px 14px;cursor:pointer;background:${dcStr(v.coursesTabRunsBg)};color:${dcStr(v.coursesTabRunsColor)}`)}>
                          {"Durchführungen"}
                        </button>
                        {"\n            "}
                        <button onClick={v.tabCoursesTypes} style={cssToObj(`border:0;padding:7px 14px;cursor:pointer;border-inline-start:1px solid var(--line2);background:${dcStr(v.coursesTabTypesBg)};color:${dcStr(v.coursesTabTypesColor)}`)}>
                          {"Kurstypen"}
                        </button>
                        {"\n          "}
                      </div>
                      {"\n          "}
                      {(v.canEdit) ? (<>
                        <button onClick={v.openNewCourse} style={{"marginInlineStart": "auto", "background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                          {"Kurs anlegen"}
                        </button>
                      </>) : null}
                      {"\n        "}
                    </div>
                    {"\n        "}
                    {(v.coursesTabRuns) ? (<>
                      {"\n          "}
                      <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                        {"\n            "}
                        <div style={{"minWidth": "900px"}}>
                          {"\n            "}
                          <div style={{"display": "grid", "gridTemplateColumns": "80px minmax(160px,2fr) 110px 60px 100px 1fr 60px 110px", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                            <span>
                              {"Code"}
                            </span>
                            <span>
                              {"Kurs"}
                            </span>
                            <span>
                              {"Standort"}
                            </span>
                            <span>
                              {"KW"}
                            </span>
                            <span>
                              {"Tage"}
                            </span>
                            <span>
                              {"Ausbilder"}
                            </span>
                            <span>
                              {"TN"}
                            </span>
                            <span>
                              {"Status"}
                            </span>
                          </div>
                          {"\n            "}
                          {dcList(v.courseRows).map((c, $index) => (<React.Fragment key={$index}>
                            {"\n              "}
                            <button onClick={c?.open} style={{"display": "grid", "gridTemplateColumns": "80px minmax(160px,2fr) 110px 60px 100px 1fr 60px 110px", "gap": "12px", "padding": "var(--pad) 16px", "border": "0", "borderBottom": "1px solid var(--line)", "background": "none", "textAlign": "start", "cursor": "pointer", "alignItems": "center", "width": "100%"}} className={"scp2"}>
                              {"\n                "}
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                {dcText(c?.code)}
                              </span>
                              <span style={{"fontWeight": "500"}}>
                                {dcText(c?.name)}
                              </span>
                              <span>
                                {dcText(c?.locName)}
                              </span>
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                {dcText(c?.kw)}
                              </span>
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                                {dcText(c?.dayRange)}
                              </span>
                              <span style={cssToObj(`color:${dcStr(c?.instrColor)}`)}>
                                {dcText(c?.instrLabel)}
                              </span>
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                {dcText(c?.enrolled)}{"/"}{dcText(c?.max)}
                              </span>
                              {"\n                "}
                              <span style={{"display": "flex", "gap": "6px", "alignItems": "center", "fontSize": "12px"}}>
                                <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(c?.color)}`)}></span>
                                {dcText(c?.statusLabel)}
                              </span>
                              {"\n              "}
                            </button>
                            {"\n            "}
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.coursesTabTypes) ? (<>
                      {"\n          "}
                      <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fill,minmax(300px,1fr))", "gap": "12px"}}>
                        {"\n            "}
                        {dcList(v.typeCards).map((t, $index) => (<React.Fragment key={$index}>
                          {"\n              "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                            {"\n                "}
                            <div style={{"display": "flex", "gap": "8px", "alignItems": "center"}}>
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "background": "var(--surface2)", "borderRadius": "var(--r)", "padding": "2px 6px"}}>
                                {dcText(t?.code)}
                              </span>
                              <span style={{"fontWeight": "600"}}>
                                {dcText(t?.name)}
                              </span>
                              <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
                                {dcText(t?.kind)}
                              </span>
                            </div>
                            {"\n                "}
                            <div style={{"display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "4px 12px", "fontSize": "13px"}}>
                              {"\n                  "}
                              <span style={{"color": "var(--muted)"}}>
                                {"Dauer"}
                              </span>
                              <span>
                                {dcText(t?.duration)}
                              </span>
                              {"\n                  "}
                              <span style={{"color": "var(--muted)"}}>
                                {"Track"}
                              </span>
                              <span>
                                {dcText(t?.track)}
                              </span>
                              {"\n                  "}
                              <span style={{"color": "var(--muted)"}}>
                                {"Skills"}
                              </span>
                              <span>
                                {dcText(t?.skills)}
                              </span>
                              {"\n                  "}
                              <span style={{"color": "var(--muted)"}}>
                                {"Zertifikate"}
                              </span>
                              <span>
                                {dcText(t?.certs)}
                              </span>
                              {"\n                  "}
                              <span style={{"color": "var(--muted)"}}>
                                {"Geräte"}
                              </span>
                              <span>
                                {dcText(t?.devs)}
                              </span>
                              {"\n                  "}
                              <span style={{"color": "var(--muted)"}}>
                                {"Teilnehmer"}
                              </span>
                              <span>
                                {dcText(t?.tn)}
                              </span>
                              {"\n                "}
                            </div>
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </React.Fragment>))}
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.demand) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Planungslauf"} style={{"display": "flex", "flexDirection": "column", "gap": "16px"}}>
                    {"\n        "}
                    {(v.noActiveRun) ? (<>
                      {"\n          "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "12px"}}>
                        {"\n            "}
                        <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(140px,1fr))", "gap": "12px"}}>
                          {"\n              "}
                          {dcList(v.intakeKpis).map((k, $index) => (<React.Fragment key={$index}>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px 16px", "display": "flex", "flexDirection": "column", "gap": "4px"}}>
                              {"\n                  "}
                              <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                {dcText(k?.label)}
                              </div>
                              {"\n                  "}
                              <div style={{"display": "flex", "alignItems": "baseline", "gap": "8px"}}>
                                <span style={cssToObj(`font-size:26px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:${dcStr(k?.color)}`)}>
                                  {dcText(k?.value)}
                                </span>
                                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                  {dcText(k?.unit)}
                                </span>
                              </div>
                              {"\n                  "}
                              {(k?.action) ? (<>
                                <button onClick={k?.action?.run} style={{"alignSelf": "flex-start", "border": "0", "background": "none", "color": "var(--accent)", "cursor": "pointer", "padding": "0", "fontSize": "12px"}}>
                                  {dcText(k?.action?.label)}
                                </button>
                              </>) : null}
                              {"\n                "}
                            </div>
                            {"\n              "}
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n            "}
                        <div style={{"display": "flex", "gap": "10px", "alignItems": "center", "flexWrap": "wrap"}}>
                          {"\n              "}
                          <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty", "flex": "1 1 320px"}}>
                            {"Ein Planungslauf plant ein Semester: Bedarf aus den Jahrgängen, Kurse in die Zeitfenster, Ausbilder auf die Kurse. Gleitendes Fenster – jedes Semester wird ein neuer Lauf eröffnet."}
                          </div>
                          {"\n              "}
                          <button onClick={v.openRunDialog} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "9px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                            {"Neuen Planungslauf starten"}
                          </button>
                          {"\n            "}
                        </div>
                        {"\n            "}
                        <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                          <div>
                            {"\n              "}
                            <div style={{"display": "grid", "gridTemplateColumns": "minmax(150px,1.5fr) 90px minmax(80px,1fr) 120px auto", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                              <span>
                                {"Periode"}
                              </span>
                              <span>
                                {"Schuljahr"}
                              </span>
                              <span>
                                {"Fortschritt"}
                              </span>
                              <span>
                                {"Status"}
                              </span>
                              <span></span>
                            </div>
                            {"\n              "}
                            {dcList(v.runRows).map((r, $index) => (<React.Fragment key={$index}>
                              {"\n                "}
                              <div style={{"display": "grid", "gridTemplateColumns": "minmax(150px,1.5fr) 90px minmax(80px,1fr) 120px auto", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center", "fontSize": "13px"}}>
                                {"\n                  "}
                                <span style={{"minWidth": "0"}}>
                                  <span style={{"display": "block", "fontWeight": "500"}}>
                                    {dcText(r?.label)}
                                  </span>
                                  <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)"}}>
                                    {dcText(r?.months)}{" · erstellt "}{dcText(r?.created)}
                                  </span>
                                </span>
                                {"\n                  "}
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(r?.year)}
                                </span>
                                {"\n                  "}
                                <span style={{"display": "flex", "gap": "4px"}}>
                                  {dcList(r?.dots).map((d, $index) => (<React.Fragment key={$index}>
                                    <span title={d?.title} style={cssToObj(`flex:1;height:8px;border-radius:2px;background:${dcStr(d?.color)}`)}></span>
                                  </React.Fragment>))}
                                </span>
                                {"\n                  "}
                                <span style={cssToObj(`display:flex;gap:6px;align-items:center;font-size:12px;color:${dcStr(r?.color)}`)}>
                                  <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(r?.color)}`)}></span>
                                  {dcText(r?.status)}
                                </span>
                                {"\n                  "}
                                <span style={{"display": "flex", "gap": "6px", "justifyContent": "flex-end"}}>
                                  <button onClick={r?.open} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "5px 12px", "fontSize": "12px", "cursor": "pointer", "whiteSpace": "nowrap"}} className={"scp4"}>
                                    {dcText(r?.cta)}
                                  </button>
                                  <button onClick={r?.remove} aria-label={"Lauf verwerfen"} style={{"border": "0", "background": "none", "color": "var(--muted)", "cursor": "pointer", "padding": "0 6px", "fontSize": "15px"}} className={"scp7"}>
                                    {"×"}
                                  </button>
                                </span>
                                {"\n                "}
                              </div>
                              {"\n              "}
                            </React.Fragment>))}
                            {"\n              "}
                            {(v.noRuns) ? (<>
                              <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
                                {"Noch kein Planungslauf angelegt."}
                              </div>
                            </>) : null}
                            {"\n            "}
                          </div>
                        </div>
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.activeRun) ? (<>
                      {"\n        "}
                      <div style={{"display": "flex", "gap": "12px", "alignItems": "center", "flexWrap": "wrap"}}>
                        {"\n          "}
                        <button onClick={v.closeRun} style={{"border": "0", "background": "none", "color": "var(--accent)", "cursor": "pointer", "padding": "0", "fontSize": "13px"}}>
                          {"← Alle Planungsläufe"}
                        </button>
                        {"\n          "}
                        <span style={{"fontWeight": "600"}}>
                          {dcText(v.planPeriodLabel)}
                        </span>
                        <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                          {dcText(v.planPeriodMonths)}{" · erstellt "}{dcText(v.planRunCreated)}
                        </span>
                        {"\n        "}
                      </div>
                      {"\n        "}
                      <div style={{"display": "flex", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden", "background": "var(--surface)"}}>
                        {"\n          "}
                        {dcList(v.planSteps).map((s, $index) => (<React.Fragment key={$index}>
                          {"\n            "}
                          <button onClick={s?.go} style={cssToObj(`flex:1;border:0;border-inline-end:1px solid var(--line);background:${dcStr(s?.bg)};padding:12px 14px;cursor:pointer;text-align:start;display:flex;gap:10px;align-items:center;min-width:0`)} className={"scp2"}>
                            {"\n              "}
                            <span style={cssToObj(`width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:600;background:${dcStr(s?.dotBg)};color:${dcStr(s?.dotColor)};flex-shrink:0`)}>
                              {dcText(s?.n)}
                            </span>
                            {"\n              "}
                            <span style={{"minWidth": "0"}}>
                              <span style={cssToObj(`display:block;font-weight:500;color:${dcStr(s?.color)}`)}>
                                {dcText(s?.label)}
                              </span>
                              <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>
                                {dcText(s?.meta)}
                              </span>
                            </span>
                            {"\n            "}
                          </button>
                          {"\n          "}
                        </React.Fragment>))}
                        {"\n        "}
                      </div>
                      {"\n\n        "}
                      {(v.planStep1) ? (<>
                        {"\n          "}
                        <div style={{"display": "flex", "flexDirection": "column", "gap": "12px"}}>
                          {"\n            "}
                          <div style={{"display": "flex", "gap": "10px", "alignItems": "center", "flexWrap": "wrap"}}>
                            {"\n              "}
                            <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty", "flex": "1 1 320px"}}>
                              {"Lernende je Jahrgang, Modul und Schultag-Gruppe. Der Standort ergibt sich aus der nächsten Berufsschule, die Kurszahl aus der maximalen Teilnehmerzahl."}
                            </div>
                            {"\n              "}
                            <button onClick={v.planGenerate} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "9px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                              {"Bedarf für "}{dcText(v.planPeriodLabel)}{" erzeugen"}
                            </button>
                            {"\n            "}
                          </div>
                          {"\n            "}
                          {(v.hasDemand) ? (<>
                            {"\n              "}
                            <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(150px,1fr))", "gap": "12px"}}>
                              {dcList(v.demandKpis).map((k, $index) => (<React.Fragment key={$index}>
                                <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px"}}>
                                  <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                    {dcText(k?.label)}
                                  </div>
                                  <div style={{"fontSize": "22px", "fontWeight": "600", "fontVariantNumeric": "tabular-nums"}}>
                                    {dcText(k?.value)}
                                  </div>
                                </div>
                              </React.Fragment>))}
                            </div>
                            {"\n              "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                              <div style={{"minWidth": "1000px"}}>
                                {"\n                "}
                                <div style={{"display": "grid", "gridTemplateColumns": "100px 90px minmax(200px,1fr) 120px 150px 90px 90px", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                                  <span>
                                    {"Jahrgang"}
                                  </span>
                                  <span>
                                    {"Modul"}
                                  </span>
                                  <span>
                                    {"Inhalt"}
                                  </span>
                                  <span>
                                    {"Standort"}
                                  </span>
                                  <span>
                                    {"Schultag"}
                                  </span>
                                  <span>
                                    {"Lernende"}
                                  </span>
                                  <span>
                                    {"Kurse"}
                                  </span>
                                </div>
                                {"\n                "}
                                {dcList(v.demandRows).map((d, $index) => (<React.Fragment key={$index}>
                                  {"\n                  "}
                                  <div style={{"display": "grid", "gridTemplateColumns": "100px 90px minmax(200px,1fr) 120px 150px 90px 90px", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center", "fontSize": "13px"}}>
                                    {"\n                    "}
                                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                      {dcText(d?.cohort)}
                                    </span>
                                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "fontWeight": "500"}}>
                                      {dcText(d?.code)}
                                    </span>
                                    <span>
                                      {dcText(d?.name)}
                                      <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)"}}>
                                        {dcText(d?.sem)}{". Semester · "}{dcText(d?.window)}{" · "}{dcText(d?.days)}{" Tage"}
                                      </span>
                                    </span>
                                    <span>
                                      {dcText(d?.locName)}
                                    </span>
                                    {"\n                    "}
                                    <span style={{"fontSize": "12px"}}>
                                      <span style={{"borderRadius": "999px", "padding": "2px 8px", "background": "var(--surface2)"}}>
                                        {"Schule "}{dcText(d?.dayLabel)}
                                      </span>
                                      <span style={{"display": "block", "color": "var(--muted)", "marginTop": "2px"}}>
                                        {"ÜK an anderen Tagen"}
                                      </span>
                                    </span>
                                    {"\n                    "}
                                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                      {dcText(d?.n)}
                                    </span>
                                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "fontWeight": "500"}}>
                                      {dcText(d?.need)}
                                    </span>
                                    {"\n                  "}
                                  </div>
                                  {"\n                "}
                                </React.Fragment>))}
                                {"\n              "}
                              </div>
                            </div>
                            {"\n              "}
                            <button onClick={v.planNext} style={{"alignSelf": "flex-end", "background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "9px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                              {"Weiter: Kurse und Termine vorschlagen"}
                            </button>
                            {"\n            "}
                          </>) : null}
                          {"\n            "}
                          {(v.noDemand) ? (<>
                            {"\n              "}
                            <div style={{"border": "1px dashed var(--line2)", "borderRadius": "var(--r2)", "padding": "28px", "textAlign": "center", "color": "var(--muted)", "fontSize": "13px", "textWrap": "pretty"}}>
                              {"Noch kein Bedarf für "}{dcText(v.planPeriodLabel)}{" erzeugt."}
                            </div>
                            {"\n            "}
                          </>) : null}
                          {"\n          "}
                        </div>
                        {"\n        "}
                      </>) : null}
                      {"\n\n        "}
                      {(v.planStep2) ? (<>
                        {"\n          "}
                        <div style={{"display": "flex", "flexDirection": "column", "gap": "12px"}}>
                          {"\n            "}
                          <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                            {"Vorschlag pro Kurs: Woche im Zeitfenster, Raum am Standort, Wochentage ohne den Schultag der Gruppe. Kapazität je Standort und Raumbelegung sind berücksichtigt."}
                          </div>
                          {"\n            "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                            <div style={{"minWidth": "1060px"}}>
                              {"\n              "}
                              <div style={{"display": "grid", "gridTemplateColumns": "90px minmax(170px,1fr) 110px 70px 150px 130px 80px minmax(150px,1fr)", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                                <span>
                                  {"Modul"}
                                </span>
                                <span>
                                  {"Inhalt"}
                                </span>
                                <span>
                                  {"Standort"}
                                </span>
                                <span>
                                  {"KW"}
                                </span>
                                <span>
                                  {"Tage"}
                                </span>
                                <span>
                                  {"Raum"}
                                </span>
                                <span>
                                  {"Plätze"}
                                </span>
                                <span>
                                  {"Hinweis"}
                                </span>
                              </div>
                              {"\n              "}
                              {dcList(v.planCourseRows).map((c, $index) => (<React.Fragment key={$index}>
                                {"\n                "}
                                <div style={cssToObj(`display:grid;grid-template-columns:90px minmax(170px,1fr) 110px 70px 150px 130px 80px minmax(150px,1fr);gap:12px;padding:var(--pad) 16px;border-bottom:1px solid var(--line);align-items:center;font-size:13px;background:${dcStr(c?.bg)}`)}>
                                  {"\n                  "}
                                  <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "fontWeight": "500"}}>
                                    {dcText(c?.code)}
                                  </span>
                                  <span>
                                    {dcText(c?.name)}
                                    <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)"}}>
                                      {dcText(c?.cohort)}
                                    </span>
                                  </span>
                                  <span>
                                    {dcText(c?.locName)}
                                  </span>
                                  <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                    {dcText(c?.kwLabel)}
                                  </span>
                                  <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                    {dcText(c?.dayLabel)}
                                  </span>
                                  <span>
                                    {dcText(c?.room)}
                                  </span>
                                  <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                    {dcText(c?.seats)}
                                  </span>
                                  {"\n                  "}
                                  <span style={{"display": "flex", "gap": "8px", "alignItems": "center", "justifyContent": "space-between"}}>
                                    <span style={cssToObj(`font-size:12px;color:${dcStr(c?.noteColor)};text-wrap:pretty`)}>
                                      {dcText(c?.note)}
                                    </span>
                                    {(c?.needsFix) ? (<>
                                      <button onClick={c?.fix} style={{"border": "1px solid var(--bad)", "background": "var(--surface)", "color": "var(--bad)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "whiteSpace": "nowrap", "fontWeight": "500"}} className={"scp8"}>
                                        {"Lösung finden"}
                                      </button>
                                    </>) : null}
                                  </span>
                                  {"\n                "}
                                </div>
                                {"\n              "}
                              </React.Fragment>))}
                              {"\n            "}
                            </div>
                          </div>
                          {"\n            "}
                          <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end", "alignItems": "center"}}>
                            <span style={{"fontSize": "12px", "color": "var(--muted)", "marginInlineEnd": "auto"}}>
                              {dcText(v.planCourseSummary)}
                            </span>
                            <button onClick={v.planBack} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "9px 14px", "cursor": "pointer"}}>
                              {"Zurück"}
                            </button>
                            <button onClick={v.planNext} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "9px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                              {"Weiter: Ausbilder zuteilen"}
                            </button>
                          </div>
                          {"\n          "}
                        </div>
                        {"\n        "}
                      </>) : null}
                      {"\n\n        "}
                      {(v.planStep3) ? (<>
                        {"\n          "}
                        <div style={{"display": "flex", "flexDirection": "column", "gap": "12px"}}>
                          {"\n            "}
                          <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                            {"Die Engine prüft Skills, Zertifikate an jedem Kurstag, Gerätequalifikation, Sprache, Verfügbarkeit und bewertet Nähe, Kontinuität und Qualifikationspflege."}
                          </div>
                          {"\n            "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                            <div style={{"minWidth": "1040px"}}>
                              {"\n              "}
                              <div style={{"display": "grid", "gridTemplateColumns": "90px minmax(160px,1fr) 110px 70px minmax(170px,1fr) 70px minmax(180px,1.2fr)", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                                <span>
                                  {"Modul"}
                                </span>
                                <span>
                                  {"Inhalt"}
                                </span>
                                <span>
                                  {"Standort"}
                                </span>
                                <span>
                                  {"KW"}
                                </span>
                                <span>
                                  {"Vorschlag"}
                                </span>
                                <span>
                                  {"Score"}
                                </span>
                                <span>
                                  {"Begründung"}
                                </span>
                              </div>
                              {"\n              "}
                              {dcList(v.planStaffRows).map((c, $index) => (<React.Fragment key={$index}>
                                {"\n                "}
                                <div style={cssToObj(`display:grid;grid-template-columns:90px minmax(160px,1fr) 110px 70px minmax(170px,1fr) 70px minmax(180px,1.2fr);gap:12px;padding:var(--pad) 16px;border-bottom:1px solid var(--line);align-items:center;font-size:13px;background:${dcStr(c?.bg)}`)}>
                                  {"\n                  "}
                                  <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "fontWeight": "500"}}>
                                    {dcText(c?.code)}
                                  </span>
                                  <span>
                                    {dcText(c?.name)}
                                  </span>
                                  <span>
                                    {dcText(c?.locName)}
                                  </span>
                                  <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                    {dcText(c?.kwLabel)}
                                  </span>
                                  {"\n                  "}
                                  <span style={cssToObj(`color:${dcStr(c?.candColor)};font-weight:500`)}>
                                    {dcText(c?.candName)}
                                    <span style={{"display": "block", "fontSize": "12px", "fontWeight": "400", "color": "var(--muted)"}}>
                                      {dcText(c?.candCountLabel)}
                                    </span>
                                  </span>
                                  {"\n                  "}
                                  <span style={cssToObj(`font-family:var(--mono);font-size:12px;color:${dcStr(c?.candColor)}`)}>
                                    {dcText(c?.score)}
                                  </span>
                                  {"\n                  "}
                                  <span style={{"display": "flex", "gap": "8px", "alignItems": "center", "justifyContent": "space-between"}}>
                                    <span style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                                      {dcText(c?.why)}
                                    </span>
                                    {(c?.needsFix) ? (<>
                                      <button onClick={c?.fix} style={{"border": "1px solid var(--bad)", "background": "var(--surface)", "color": "var(--bad)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "whiteSpace": "nowrap", "fontWeight": "500"}} className={"scp8"}>
                                        {"Lösung finden"}
                                      </button>
                                    </>) : null}
                                  </span>
                                  {"\n                "}
                                </div>
                                {"\n              "}
                              </React.Fragment>))}
                              {"\n            "}
                            </div>
                          </div>
                          {"\n            "}
                          <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end", "alignItems": "center"}}>
                            <span style={{"fontSize": "12px", "color": "var(--muted)", "marginInlineEnd": "auto"}}>
                              {dcText(v.planStaffSummary)}
                            </span>
                            <button onClick={v.planBack} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "9px 14px", "cursor": "pointer"}}>
                              {"Zurück"}
                            </button>
                            <button onClick={v.planNext} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "9px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                              {"Weiter: Übernahme prüfen"}
                            </button>
                          </div>
                          {"\n          "}
                        </div>
                        {"\n        "}
                      </>) : null}
                      {"\n\n        "}
                      {(v.planStep4) ? (<>
                        {"\n          "}
                        <div style={{"display": "flex", "flexDirection": "column", "gap": "12px", "maxWidth": "760px"}}>
                          {"\n            "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                            {"\n              "}
                            <div style={{"fontWeight": "600"}}>
                              {"Übernahme in den Zeitplan"}
                            </div>
                            {"\n              "}
                            {dcList(v.planSummary).map((s, $index) => (<React.Fragment key={$index}>
                              <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr auto", "gap": "10px", "alignItems": "center", "fontSize": "13px", "padding": "6px 0", "borderBottom": "1px solid var(--line)"}}>
                                <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(s?.color)}`)}></span>
                                <span>
                                  {dcText(s?.label)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(s?.value)}
                                </span>
                              </div>
                            </React.Fragment>))}
                            {"\n              "}
                            <div style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                              {"Kurse werden als «geplant» angelegt, Ausbilder als Vorschlag zugewiesen. Kurse ohne machbaren Ausbilder bleiben offen und erscheinen im Zeitplan gelb."}
                            </div>
                            {"\n              "}
                            <div style={{"display": "flex", "gap": "8px"}}>
                              <button onClick={v.planBack} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "9px 14px", "cursor": "pointer"}}>
                                {"Zurück"}
                              </button>
                              <button onClick={v.planCommit} disabled={v.planCommitDisabled} style={cssToObj(`background:${dcStr(v.planCommitBg)};color:var(--accent-ink);border:0;border-radius:var(--r);padding:9px 14px;font-weight:500;cursor:${dcStr(v.planCommitCursor)}`)}>
                                {dcText(v.planCommitLabel)}
                              </button>
                            </div>
                            {"\n            "}
                          </div>
                          {"\n            "}
                          {(v.planCommitted) ? (<>
                            {"\n              "}
                            <div style={{"background": "var(--ok-soft)", "color": "var(--ok)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "8px"}}>
                              <div style={{"fontWeight": "600"}}>
                                {"Planungslauf übernommen"}
                              </div>
                              <div style={{"fontSize": "13px"}}>
                                {dcText(v.planCommitted)}
                              </div>
                              <button onClick={v.goBoard} style={{"alignSelf": "flex-start", "border": "1px solid currentColor", "background": "none", "color": "inherit", "borderRadius": "var(--r)", "padding": "6px 12px", "fontSize": "13px", "cursor": "pointer"}}>
                                {"Zum Zeitplan"}
                              </button>
                            </div>
                            {"\n            "}
                          </>) : null}
                          {"\n          "}
                        </div>
                        {"\n        "}
                      </>) : null}
                      {"\n        "}
                    </>) : null}
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.instructors) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Ausbilder"} style={{"display": "flex", "flexDirection": "column", "gap": "14px"}}>
                    {"\n        "}
                    {(v.noInstrDetail) ? (<>
                      {"\n          "}
                      <div style={{"display": "flex", "gap": "8px", "flexWrap": "wrap"}}>
                        {"\n            "}
                        <input value={dcVal(v.instrSearch, "value")} onChange={v.setInstrSearch} placeholder={"Name suchen…"} aria-label={"Suche"} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)", "minWidth": "220px"}} />
                        {"\n            "}
                        <select value={dcVal(v.filterSkill, "value")} onChange={v.setFilterSkill} aria-label={"Skill"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                          <option value={""}>
                            {"Alle Skills"}
                          </option>
                          {dcList(v.skills).map((s, $index) => (<React.Fragment key={$index}>
                            <option>
                              {dcText(s)}
                            </option>
                          </React.Fragment>))}
                        </select>
                        {"\n            "}
                        <select value={dcVal(v.filterLang, "value")} onChange={v.setFilterLang} aria-label={"Sprache"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                          <option value={""}>
                            {"Alle Sprachen"}
                          </option>
                          <option value={"D"}>
                            {"Deutsch"}
                          </option>
                          <option value={"F"}>
                            {"Französisch"}
                          </option>
                          <option value={"I"}>
                            {"Italienisch"}
                          </option>
                        </select>
                        {"\n                      "}
                      </div>
                      {"\n          "}
                      <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                        {"\n            "}
                        <div style={{"minWidth": "860px"}}>
                          {"\n            "}
                          <div style={{"display": "grid", "gridTemplateColumns": "minmax(180px,1.4fr) 120px 120px 80px minmax(200px,2fr)", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                            <span>
                              {"Name"}
                            </span>
                            <span>
                              {"Anstellung"}
                            </span>
                            <span>
                              {"Standort"}
                            </span>
                            <span>
                              {"Sprachen"}
                            </span>
                            <span>
                              {"Skills"}
                            </span>
                          </div>
                          {"\n            "}
                          {dcList(v.instrRows).map((i, $index) => (<React.Fragment key={$index}>
                            {"\n              "}
                            <button onClick={i?.open} style={{"display": "grid", "gridTemplateColumns": "minmax(180px,1.4fr) 120px 120px 80px minmax(200px,2fr)", "gap": "12px", "padding": "var(--pad) 16px", "border": "0", "borderBottom": "1px solid var(--line)", "background": "none", "textAlign": "start", "cursor": "pointer", "alignItems": "center", "width": "100%"}} className={"scp2"}>
                              {"\n                "}
                              <span style={{"display": "flex", "alignItems": "center", "gap": "10px"}}>
                                <span style={{"width": "28px", "height": "28px", "borderRadius": "50%", "background": "var(--surface2)", "display": "grid", "placeItems": "center", "fontSize": "11px", "fontWeight": "600", "color": "var(--muted)", "flexShrink": "0"}}>
                                  {dcText(i?.initials)}
                                </span>
                                <span style={{"fontWeight": "500"}}>
                                  {dcText(i?.name)}
                                </span>
                              </span>
                              {"\n                "}
                              <span style={{"fontSize": "13px"}}>
                                {dcText(i?.employment)}
                              </span>
                              <span style={{"fontSize": "13px"}}>
                                {dcText(i?.locName)}
                              </span>
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                {dcText(i?.langs)}
                              </span>
                              <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                {dcText(i?.skills)}
                              </span>
                              {"\n              "}
                            </button>
                            {"\n            "}
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.instrDetail) ? (<>
                      {"\n          "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "16px"}}>
                        {"\n            "}
                        <button onClick={v.closeInstr} style={{"alignSelf": "flex-start", "border": "0", "background": "none", "color": "var(--accent)", "cursor": "pointer", "padding": "0", "fontSize": "13px"}}>
                          {"← Alle Ausbilder"}
                        </button>
                        {"\n            "}
                        <div style={{"display": "flex", "gap": "16px", "alignItems": "center", "flexWrap": "wrap"}}>
                          {"\n              "}
                          <div style={{"width": "52px", "height": "52px", "borderRadius": "50%", "background": "var(--accent-soft)", "color": "var(--accent)", "display": "grid", "placeItems": "center", "fontSize": "18px", "fontWeight": "600"}}>
                            {dcText(v.instrDetail?.initials)}
                          </div>
                          {"\n              "}
                          <div>
                            <div style={{"fontSize": "20px", "fontWeight": "600", "letterSpacing": "-.01em"}}>
                              {dcText(v.instrDetail?.name)}
                            </div>
                            <div style={{"color": "var(--muted)", "fontSize": "13px"}}>
                              {dcText(v.instrDetail?.employment)}{" · "}{dcText(v.instrDetail?.locName)}{" · Sprachen "}{dcText(v.instrDetail?.langs)}
                            </div>
                          </div>
                          {"\n              "}
                          <div style={{"marginInlineStart": "auto", "display": "flex", "gap": "8px", "alignItems": "center"}}>
                            <span style={{"fontSize": "12px", "border": "1px solid var(--line)", "borderRadius": "999px", "padding": "3px 10px"}}>
                              {dcText(v.instrDetail?.assignLabel)}
                            </span>
                          </div>
                          {"\n            "}
                        </div>
                        {"\n            "}
                        <div style={{"display": "flex", "gap": "2px", "borderBottom": "1px solid var(--line)"}}>
                          {"\n              "}
                          {dcList(v.instrTabs).map((t, $index) => (<React.Fragment key={$index}>
                            <button onClick={t?.go} style={cssToObj(`border:0;background:none;padding:8px 14px;cursor:pointer;color:${dcStr(t?.color)};font-weight:${dcStr(t?.weight)};border-bottom:2px solid ${dcStr(t?.line)};margin-bottom:-1px`)}>
                              {dcText(t?.label)}
                            </button>
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n            "}
                        {(v.instrTab?.skills) ? (<>
                          {"\n              "}
                          <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(280px,1fr))", "gap": "16px"}}>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                              {"\n                  "}
                              <div style={{"fontWeight": "600"}}>
                                {"Skills"}
                              </div>
                              {"\n                  "}
                              <div style={{"display": "flex", "flexWrap": "wrap", "gap": "6px"}}>
                                {dcList(v.instrDetail?.skillChips).map((s, $index) => (<React.Fragment key={$index}>
                                  <span style={{"border": "1px solid var(--line)", "borderRadius": "999px", "padding": "4px 6px 4px 10px", "fontSize": "12px", "display": "flex", "gap": "6px", "alignItems": "center"}}>
                                    {dcText(s?.name)}
                                    <button onClick={s?.remove} aria-label={"Skill entfernen"} style={{"border": "0", "background": "none", "color": "var(--muted)", "cursor": "pointer", "padding": "0 2px", "lineHeight": "1", "fontSize": "14px"}} className={"scp7"}>
                                      {"×"}
                                    </button>
                                  </span>
                                </React.Fragment>))}
                              </div>
                              {"\n                  "}
                              {(v.canEdit) ? (<>
                                <button onClick={v.openSkillDialog} style={{"alignSelf": "flex-start", "border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "6px 12px", "fontSize": "13px", "cursor": "pointer"}} className={"scp4"}>
                                  {"Skill hinzufügen"}
                                </button>
                              </>) : null}
                              {"\n                  "}
                              <div style={{"fontWeight": "600", "marginTop": "8px"}}>
                                {"Gerätequalifikationen"}
                              </div>
                              <div style={{"display": "flex", "flexWrap": "wrap", "gap": "6px"}}>
                                {dcList(v.instrDetail?.devQuals).map((d, $index) => (<React.Fragment key={$index}>
                                  <span style={cssToObj(`border-radius:999px;padding:4px 10px;font-size:12px;background:${dcStr(d?.bg)};color:${dcStr(d?.color)}`)}>
                                    {dcText(d?.label)}
                                  </span>
                                </React.Fragment>))}
                              </div>
                              {"\n                  "}
                              <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                {"Gerätequalifikationen ergeben sich aus Skills und gültigen Zertifikaten."}
                              </div>
                              {"\n                "}
                            </div>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                              {"\n                  "}
                              <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                                <div style={{"fontWeight": "600"}}>
                                  {"Unterrichtbare Kurstypen"}
                                </div>
                                <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
                                  {dcText(v.instrDetail?.teachCount)}{" freigegeben"}
                                </span>
                              </div>
                              {"\n                  "}
                              {dcList(v.instrDetail?.teachRows).map((t, $index) => (<React.Fragment key={$index}>
                                {"\n                    "}
                                <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr auto", "gap": "10px", "alignItems": "center", "fontSize": "13px", "padding": "6px 0", "borderBottom": "1px solid var(--line)"}}>
                                  <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(t?.color)}`)}></span>
                                  <span>
                                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                                      {dcText(t?.code)}
                                    </span>
                                    {" "}{dcText(t?.name)}
                                    <span style={cssToObj(`display:block;font-size:12px;color:${dcStr(t?.color)}`)}>
                                      {dcText(t?.note)}
                                    </span>
                                  </span>
                                  <button onClick={t?.remove} aria-label={"Kurstyp entfernen"} style={{"border": "0", "background": "none", "color": "var(--muted)", "cursor": "pointer", "padding": "0 4px", "fontSize": "15px", "lineHeight": "1"}} className={"scp7"}>
                                    {"×"}
                                  </button>
                                </div>
                                {"\n                  "}
                              </React.Fragment>))}
                              {"\n                  "}
                              {(v.instrDetail?.hasSuggestions) ? (<>
                                {"\n                    "}
                                <div style={{"display": "flex", "flexDirection": "column", "gap": "6px", "marginTop": "4px"}}>
                                  <div style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                                    {"Vorschläge nach Skills und Zertifikaten"}
                                  </div>
                                  {"\n                      "}
                                  <div style={{"display": "flex", "flexWrap": "wrap", "gap": "6px"}}>
                                    {dcList(v.instrDetail?.teachSuggestions).map((s, $index) => (<React.Fragment key={$index}>
                                      <button onClick={s?.add} title={s?.why} style={{"border": "1px dashed var(--line2)", "background": "var(--surface)", "borderRadius": "999px", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "display": "flex", "gap": "6px", "alignItems": "center"}} className={"scp4"}>
                                        {"+ "}{dcText(s?.code)}{" "}{dcText(s?.name)}
                                      </button>
                                    </React.Fragment>))}
                                  </div>
                                  {"\n                    "}
                                </div>
                                {"\n                  "}
                              </>) : null}
                              {"\n                "}
                            </div>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "12px"}}>
                              {"\n                  "}
                              <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                                <div style={{"fontWeight": "600"}}>
                                  {"Kontakt"}
                                </div>
                                {(v.canEdit) ? (<>
                                  <button onClick={v.openContactDialog} style={{"marginInlineStart": "auto", "border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "5px 10px", "fontSize": "12px", "cursor": "pointer"}} className={"scp4"}>
                                    {"Bearbeiten"}
                                  </button>
                                </>) : null}
                              </div>
                              {"\n                  "}
                              <div style={{"display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "6px 12px", "fontSize": "13px", "alignItems": "baseline"}}>
                                {"\n                    "}
                                <span style={{"color": "var(--muted)"}}>
                                  {"E-Mail"}
                                </span>
                                <a href={v.instrDetail?.mailto} style={{"wordBreak": "break-all"}}>
                                  {dcText(v.instrDetail?.email)}
                                </a>
                                {"\n                    "}
                                <span style={{"color": "var(--muted)"}}>
                                  {"Telefon"}
                                </span>
                                <a href={v.instrDetail?.telHref} style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(v.instrDetail?.phone)}
                                </a>
                                {"\n                    "}
                                <span style={{"color": "var(--muted)"}}>
                                  {"Heimstandort"}
                                </span>
                                <span>
                                  {dcText(v.instrDetail?.locName)}
                                </span>
                                {"\n                    "}
                                <span style={{"color": "var(--muted)"}}>
                                  {"Max. Reise"}
                                </span>
                                <span>
                                  {dcText(v.instrDetail?.maxTravel)}
                                </span>
                                {"\n                    "}
                                <span style={{"color": "var(--muted)"}}>
                                  {"Bevorzugt"}
                                </span>
                                <span>
                                  {dcText(v.instrDetail?.prefLocs)}
                                </span>
                                {"\n                  "}
                              </div>
                              {"\n                "}
                            </div>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                              {"\n                  "}
                              <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                                <div style={{"fontWeight": "600"}}>
                                  {"Implizites Wissen"}
                                </div>
                                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                  {"Planerwissen, das sonst in den Köpfen bleibt"}
                                </span>
                              </div>
                              {"\n                  "}
                              {(v.canEdit) ? (<>
                                {"\n                    "}
                                <textarea value={dcVal(v.noteDraft, "value")} onChange={v.setNoteDraft} onBlur={v.saveNote} rows={"5"} placeholder={"z. B. bevorzugte Standorte, Wochentage, Paarungen, die zu vermeiden sind"} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "10px 12px", "background": "var(--surface)", "fontSize": "13px", "lineHeight": "1.5", "resize": "vertical", "minHeight": "96px"}}></textarea>
                                {"\n                    "}
                                <div style={{"display": "flex", "gap": "8px", "alignItems": "center"}}>
                                  <button onClick={v.saveNote} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "6px 12px", "fontSize": "13px", "fontWeight": "500", "cursor": "pointer"}}>
                                    {"Notiz speichern"}
                                  </button>
                                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                    {dcText(v.noteState)}
                                  </span>
                                </div>
                                {"\n                  "}
                              </>) : null}
                              {"\n                  "}
                              {(v.readOnlyNote) ? (<>
                                <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                                  {dcText(v.instrDetail?.notes)}
                                </div>
                              </>) : null}
                              {"\n                "}
                            </div>
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n            "}
                        {(v.instrTab?.certs) ? (<>
                          {"\n              "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                            {"\n                "}
                            <div style={{"display": "grid", "gridTemplateColumns": "1fr 120px 120px 120px 140px", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                              <span>
                                {"Zertifikat"}
                              </span>
                              <span>
                                {"Aussteller"}
                              </span>
                              <span>
                                {"Ausgestellt"}
                              </span>
                              <span>
                                {"Gültig bis"}
                              </span>
                              <span>
                                {"Status"}
                              </span>
                            </div>
                            {"\n                "}
                            {dcList(v.instrDetail?.certRows).map((c, $index) => (<React.Fragment key={$index}>
                              {"\n                  "}
                              <div style={{"display": "grid", "gridTemplateColumns": "1fr 120px 120px 120px 140px", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center"}}>
                                <span style={{"fontWeight": "500"}}>
                                  {dcText(c?.name)}
                                </span>
                                <span style={{"fontSize": "13px"}}>
                                  {dcText(c?.issuer)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(c?.issued)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(c?.until)}
                                </span>
                                <span style={cssToObj(`display:flex;gap:6px;align-items:center;font-size:12px;color:${dcStr(c?.color)}`)}>
                                  <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(c?.color)}`)}></span>
                                  {dcText(c?.status)}
                                </span>
                              </div>
                              {"\n                "}
                            </React.Fragment>))}
                            {"\n                "}
                            {(v.instrDetail?.noCerts) ? (<>
                              <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
                                {"Keine Zertifikate hinterlegt."}
                              </div>
                            </>) : null}
                            {"\n                "}
                            {(v.canEdit) ? (<>
                              <div style={{"padding": "12px 16px", "background": "var(--surface2)", "display": "flex"}}>
                                <button onClick={v.openCertDialog} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "7px 12px", "cursor": "pointer", "fontSize": "13px"}} className={"scp4"}>
                                  {"Zertifikat erfassen"}
                                </button>
                              </div>
                            </>) : null}
                            {"\n                "}
                            {dcList(v.instrDetail?.maint).map((m, $index) => (<React.Fragment key={$index}>
                              <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr auto", "gap": "12px", "alignItems": "center", "padding": "var(--pad) 16px", "borderTop": "1px solid var(--line)", "background": "var(--surface2)", "fontSize": "13px"}}>
                                <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(m?.color)}`)}></span>
                                <span>
                                  <span style={{"fontWeight": "500"}}>
                                    {"Qualifikationspflege:"}
                                  </span>
                                  {" "}{dcText(m?.label)}
                                </span>
                                <span style={cssToObj(`font-family:var(--mono);font-size:12px;color:${dcStr(m?.color)}`)}>
                                  {dcText(m?.count)}{" / "}{dcText(m?.min)}{" · "}{dcText(m?.openLabel)}
                                </span>
                              </div>
                            </React.Fragment>))}
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n            "}
                        {(v.instrTab?.avail) ? (<>
                          {"\n              "}
                          <div style={{"display": "flex", "flexDirection": "column", "gap": "12px"}}>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                              <div style={{"display": "grid", "gridTemplateColumns": "repeat(8,minmax(110px,1fr))", "minWidth": "880px"}}>
                                {"\n                  "}
                                {dcList(v.instrDetail?.weekCells).map((w, $index) => (<React.Fragment key={$index}>
                                  <div style={{"padding": "10px 12px", "borderInlineEnd": "1px solid var(--line)", "display": "flex", "flexDirection": "column", "gap": "6px"}}>
                                    <div style={{"fontSize": "12px", "fontWeight": "600"}}>
                                      {"KW "}{dcText(w?.kw)}
                                    </div>
                                    <div style={cssToObj(`border-radius:var(--r);padding:6px 8px;font-size:12px;background:${dcStr(w?.bg)};color:${dcStr(w?.color)};min-height:44px;text-wrap:pretty`)}>
                                      {dcText(w?.label)}
                                    </div>
                                  </div>
                                </React.Fragment>))}
                                {"\n                "}
                              </div>
                            </div>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                              {"\n                  "}
                              <div style={{"padding": "12px 16px", "borderBottom": "1px solid var(--line)", "fontWeight": "600"}}>
                                {"Abwesenheiten und Anträge"}
                              </div>
                              {"\n                  "}
                              {dcList(v.instrDetail?.absRows).map((a, $index) => (<React.Fragment key={$index}>
                                {"\n                    "}
                                <div style={{"display": "grid", "gridTemplateColumns": "1fr auto auto", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center"}}>
                                  <span>
                                    <span style={{"fontWeight": "500"}}>
                                      {dcText(a?.kind)}
                                    </span>
                                    <span style={{"color": "var(--muted)"}}>
                                      {" · "}{dcText(a?.range)}
                                    </span>
                                  </span>
                                  <span style={cssToObj(`font-size:12px;color:${dcStr(a?.color)}`)}>
                                    {dcText(a?.status)}
                                  </span>
                                  {"\n                      "}
                                  <span style={{"display": "flex", "gap": "6px"}}>
                                    {(a?.pending) ? (<>
                                      <button onClick={a?.approve} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer"}} className={"scp9"}>
                                        {"Genehmigen"}
                                      </button>
                                      <button onClick={a?.reject} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer"}} className={"scp10"}>
                                        {"Ablehnen"}
                                      </button>
                                    </>) : null}
                                  </span>
                                </div>
                                {"\n                  "}
                              </React.Fragment>))}
                              {"\n                  "}
                              {(v.instrDetail?.noAbs) ? (<>
                                <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
                                  {"Keine Abwesenheiten im Zeitraum."}
                                </div>
                              </>) : null}
                              {"\n                "}
                            </div>
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n            "}
                        {(v.instrTab?.assign) ? (<>
                          {"\n              "}
                          <div className="sc-host"><Einsatzkalender cal={v.cal} rows={v.myAssignments} leadCount={v.myAssignCount} backupCount={v.myBackupCount} empty={v.noMyAssignments} /></div>
                          {"\n            "}
                        </>) : null}
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.apprentices) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Lernende"} style={{"display": "flex", "flexDirection": "column", "gap": "12px"}}>
                    {"\n        "}
                    {(v.noApprDetail) ? (<>
                      {"\n        "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "12px", "minWidth": "0"}}>
                        {"\n          "}
                        <div style={{"display": "flex", "gap": "8px", "flexWrap": "wrap"}}>
                          {"\n            "}
                          <select value={dcVal(v.filterSchool, "value")} onChange={v.setFilterSchool} aria-label={"Berufsschule"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                            <option value={""}>
                              {"Alle Berufsschulen"}
                            </option>
                            {dcList(v.schools).map((s, $index) => (<React.Fragment key={$index}>
                              <option>
                                {dcText(s?.name)}
                              </option>
                            </React.Fragment>))}
                          </select>
                          {"\n            "}
                          <select value={dcVal(v.filterTrack, "value")} onChange={v.setFilterTrack} aria-label={"Lehrgang"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                            <option value={""}>
                              {"Alle Lehrgänge"}
                            </option>
                            <option>
                              {"EFZ"}
                            </option>
                            <option>
                              {"EBA"}
                            </option>
                          </select>
                          {"\n            "}
                          <select value={dcVal(v.filterCohort, "value")} onChange={v.setFilterCohort} aria-label={"Jahrgang"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                            <option value={""}>
                              {"Alle Jahrgänge"}
                            </option>
                            {dcList(v.cohortOptions).map((c, $index) => (<React.Fragment key={$index}>
                              <option>
                                {dcText(c)}
                              </option>
                            </React.Fragment>))}
                          </select>
                          {"\n            "}
                          <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)", "alignSelf": "center"}}>
                            {"Quelle: CSV-Export der Berufsschulen · nicht editierbar"}
                          </span>
                          {"\n          "}
                        </div>
                        {"\n          "}
                        <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                          {"\n            "}
                          <div style={{"minWidth": "700px"}}>
                            {"\n            "}
                            <div style={{"display": "grid", "gridTemplateColumns": "minmax(170px,1.5fr) 80px 90px minmax(140px,1fr) 1.2fr", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                              <span>
                                {"Name"}
                              </span>
                              <span>
                                {"Lehrgang"}
                              </span>
                              <span>
                                {"Jahrgang"}
                              </span>
                              <span>
                                {"Berufsschule"}
                              </span>
                              <span>
                                {"ÜK-Fortschritt"}
                              </span>
                            </div>
                            {"\n            "}
                            {dcList(v.apprRows).map((a, $index) => (<React.Fragment key={$index}>
                              {"\n              "}
                              <button onClick={a?.open} style={{"display": "grid", "gridTemplateColumns": "minmax(170px,1.5fr) 80px 90px minmax(140px,1fr) 1.2fr", "gap": "12px", "padding": "var(--pad) 16px", "border": "0", "borderBottom": "1px solid var(--line)", "background": "none", "textAlign": "start", "cursor": "pointer", "alignItems": "center", "width": "100%"}} className={"scp2"}>
                                {"\n                "}
                                <span style={{"fontWeight": "500"}}>
                                  {dcText(a?.name)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(a?.track)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(a?.cohort)}
                                </span>
                                <span style={{"fontSize": "13px"}}>
                                  {dcText(a?.school)}
                                </span>
                                {"\n                "}
                                <span style={{"display": "flex", "gap": "3px"}}>
                                  {dcList(a?.progress).map((p, $index) => (<React.Fragment key={$index}>
                                    <span title={p?.title} style={cssToObj(`flex:1;height:8px;border-radius:2px;background:${dcStr(p?.color)}`)}></span>
                                  </React.Fragment>))}
                                </span>
                                {"\n              "}
                              </button>
                              {"\n            "}
                            </React.Fragment>))}
                            {"\n            "}
                          </div>
                          {"\n          "}
                        </div>
                        {"\n        "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.apprDetail) ? (<>
                      {"\n          "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "16px"}}>
                        {"\n            "}
                        <button onClick={v.closeAppr} style={{"alignSelf": "flex-start", "border": "0", "background": "none", "color": "var(--accent)", "cursor": "pointer", "padding": "0", "fontSize": "13px"}}>
                          {"← Alle Lernenden"}
                        </button>
                        {"\n            "}
                        <div style={{"display": "flex", "gap": "16px", "alignItems": "center", "flexWrap": "wrap"}}>
                          {"\n              "}
                          <div style={{"width": "52px", "height": "52px", "borderRadius": "50%", "background": "var(--accent-soft)", "color": "var(--accent)", "display": "grid", "placeItems": "center", "fontSize": "18px", "fontWeight": "600"}}>
                            {dcText(v.apprDetail?.initials)}
                          </div>
                          {"\n              "}
                          <div>
                            <div style={{"fontSize": "20px", "fontWeight": "600", "letterSpacing": "-.01em"}}>
                              {dcText(v.apprDetail?.name)}
                            </div>
                            <div style={{"color": "var(--muted)", "fontSize": "13px"}}>
                              {dcText(v.apprDetail?.track)}{" · Jahrgang "}{dcText(v.apprDetail?.cohort)}{" · "}{dcText(v.apprDetail?.school)}{" · Sprache "}{dcText(v.apprDetail?.lang)}
                            </div>
                          </div>
                          {"\n              "}
                          <div style={{"marginInlineStart": "auto", "display": "flex", "gap": "8px", "alignItems": "center", "flexWrap": "wrap"}}>
                            <span style={{"fontSize": "12px", "border": "1px solid var(--line)", "borderRadius": "999px", "padding": "3px 10px"}}>
                              {dcText(v.apprDetail?.progressLabel)}
                            </span>
                            <span style={cssToObj(`font-size:12px;border:1px solid var(--line);border-radius:999px;padding:3px 10px;color:${dcStr(v.apprDetail?.statusColor)}`)}>
                              {dcText(v.apprDetail?.statusLabel)}
                            </span>
                          </div>
                          {"\n            "}
                        </div>
                        {"\n            "}
                        <div style={{"display": "flex", "gap": "2px", "borderBottom": "1px solid var(--line)"}}>
                          {"\n              "}
                          {dcList(v.apprTabs).map((t, $index) => (<React.Fragment key={$index}>
                            <button onClick={t?.go} style={cssToObj(`border:0;background:none;padding:8px 14px;cursor:pointer;color:${dcStr(t?.color)};font-weight:${dcStr(t?.weight)};border-bottom:2px solid ${dcStr(t?.line)};margin-bottom:-1px`)}>
                              {dcText(t?.label)}
                            </button>
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n            "}
                        {(v.apprTab?.plan) ? (<>
                          {"\n              "}
                          <div style={{"display": "flex", "flexDirection": "column", "gap": "12px"}}>
                            {"\n                "}
                            <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(150px,1fr))", "gap": "12px"}}>
                              {"\n                  "}
                              {dcList(v.apprDetail?.kpis).map((k, $index) => (<React.Fragment key={$index}>
                                <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px"}}>
                                  <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                    {dcText(k?.label)}
                                  </div>
                                  <div style={cssToObj(`font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;color:${dcStr(k?.color)}`)}>
                                    {dcText(k?.value)}
                                  </div>
                                </div>
                              </React.Fragment>))}
                              {"\n                "}
                            </div>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                              <div style={{"minWidth": "1020px"}}>
                                {"\n                  "}
                                <div style={{"display": "grid", "gridTemplateColumns": "70px 80px minmax(200px,1fr) 60px 110px 230px 150px", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                                  <span>
                                    {"Modul"}
                                  </span>
                                  <span>
                                    {"Semester"}
                                  </span>
                                  <span>
                                    {"Inhalt"}
                                  </span>
                                  <span>
                                    {"Tage"}
                                  </span>
                                  <span>
                                    {"Zeitfenster"}
                                  </span>
                                  <span>
                                    {"Durchführung"}
                                  </span>
                                  <span>
                                    {"Status"}
                                  </span>
                                </div>
                                {"\n                  "}
                                {dcList(v.apprDetail?.modules).map((m, $index) => (<React.Fragment key={$index}>
                                  {"\n                    "}
                                  <div style={cssToObj(`display:grid;grid-template-columns:70px 80px minmax(200px,1fr) 60px 110px 230px 150px;gap:12px;padding:var(--pad) 16px;border-bottom:1px solid var(--line);align-items:center;background:${dcStr(m?.bg)}`)}>
                                    {"\n                      "}
                                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "fontWeight": "500"}}>
                                      {dcText(m?.code)}
                                    </span>
                                    <span style={{"fontSize": "13px"}}>
                                      {dcText(m?.semLabel)}
                                    </span>
                                    {"\n                      "}
                                    <span>
                                      <span style={{"display": "block", "fontSize": "13px"}}>
                                        {dcText(m?.name)}
                                      </span>
                                      {(m?.prereqNote) ? (<>
                                        <span style={{"display": "block", "fontSize": "12px", "color": "var(--warn)"}}>
                                          {dcText(m?.prereqNote)}
                                        </span>
                                      </>) : null}
                                    </span>
                                    {"\n                      "}
                                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                                      {dcText(m?.days)}
                                    </span>
                                    <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                      {dcText(m?.window)}
                                    </span>
                                    {"\n                      "}
                                    <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                      {dcText(m?.run)}
                                    </span>
                                    {"\n                      "}
                                    <span style={{"display": "flex", "gap": "8px", "alignItems": "center", "justifyContent": "space-between"}}>
                                      <span style={cssToObj(`display:flex;gap:6px;align-items:center;font-size:12px;color:${dcStr(m?.color)}`)}>
                                        <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(m?.color)}`)}></span>
                                        {dcText(m?.status)}
                                      </span>
                                      {(m?.noType) ? (<>
                                        <span style={{"fontSize": "11px", "color": "var(--muted)", "whiteSpace": "nowrap"}}>
                                          {"kein Kurstyp hinterlegt"}
                                        </span>
                                      </>) : null}
                                      {(m?.canPlan) ? (<>
                                        <button onClick={m?.plan} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "whiteSpace": "nowrap"}} className={"scp4"}>
                                          {"Einplanen"}
                                        </button>
                                      </>) : null}
                                    </span>
                                    {"\n                    "}
                                  </div>
                                  {"\n                  "}
                                </React.Fragment>))}
                                {"\n                "}
                              </div>
                            </div>
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n            "}
                        {(v.apprTab?.history) ? (<>
                          {"\n              "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                            {"\n                "}
                            <div style={{"display": "grid", "gridTemplateColumns": "80px 110px minmax(160px,1.4fr) 120px minmax(140px,1fr) 130px", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                              <span>
                                {"Modul"}
                              </span>
                              <span>
                                {"Datum"}
                              </span>
                              <span>
                                {"Inhalt"}
                              </span>
                              <span>
                                {"Standort"}
                              </span>
                              <span>
                                {"Ausbilder"}
                              </span>
                              <span>
                                {"Anwesenheit"}
                              </span>
                            </div>
                            {"\n                "}
                            {dcList(v.apprDetail?.historyRows).map((r, $index) => (<React.Fragment key={$index}>
                              {"\n                  "}
                              <div style={{"display": "grid", "gridTemplateColumns": "80px 110px minmax(160px,1.4fr) 120px minmax(140px,1fr) 130px", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center", "fontSize": "13px"}}>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(r?.code)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(r?.date)}
                                </span>
                                <span>
                                  {dcText(r?.name)}
                                </span>
                                <span>
                                  {dcText(r?.loc)}
                                </span>
                                <span style={{"color": "var(--muted)"}}>
                                  {dcText(r?.instr)}
                                </span>
                                <span style={cssToObj(`display:flex;gap:6px;align-items:center;font-size:12px;color:${dcStr(r?.color)}`)}>
                                  <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(r?.color)}`)}></span>
                                  {dcText(r?.status)}
                                </span>
                              </div>
                              {"\n                "}
                            </React.Fragment>))}
                            {"\n                "}
                            {(v.apprDetail?.noHistory) ? (<>
                              <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
                                {"Noch keine Kursteilnahmen erfasst."}
                              </div>
                            </>) : null}
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n            "}
                        {(v.apprTab?.data) ? (<>
                          {"\n              "}
                          <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(280px,1fr))", "gap": "16px"}}>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                              <div style={{"fontWeight": "600"}}>
                                {"Stammdaten"}
                              </div>
                              <div style={{"display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "6px 12px", "fontSize": "13px"}}>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Externe ID"}
                                </span>
                                <span style={{"fontFamily": "var(--mono)"}}>
                                  {dcText(v.apprDetail?.id)}
                                </span>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Lehrgang"}
                                </span>
                                <span>
                                  {dcText(v.apprDetail?.track)}
                                </span>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Jahrgang"}
                                </span>
                                <span>
                                  {dcText(v.apprDetail?.cohort)}
                                </span>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Berufsschule"}
                                </span>
                                <span>
                                  {dcText(v.apprDetail?.school)}
                                </span>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Lehrbetrieb"}
                                </span>
                                <span>
                                  {dcText(v.apprDetail?.company)}
                                </span>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Sprache"}
                                </span>
                                <span>
                                  {dcText(v.apprDetail?.lang)}
                                </span>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Standard-Standort"}
                                </span>
                                <span>
                                  {dcText(v.apprDetail?.defaultLoc)}
                                </span>
                              </div>
                              <div style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                                {"Quelle ist der CSV-Export der Berufsschule – im Tool nicht editierbar."}
                              </div>
                            </div>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                              <div style={{"fontWeight": "600"}}>
                                {"Herkunft und Dokumente"}
                              </div>
                              <div style={{"display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "6px 12px", "fontSize": "13px"}}>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Import-Batch"}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(v.apprDetail?.batch)}
                                </span>
                                <span style={{"color": "var(--muted)"}}>
                                  {"Zuletzt aktualisiert"}
                                </span>
                                <span>
                                  {dcText(v.apprDetail?.updated)}
                                </span>
                              </div>
                              {"\n                  "}
                              <div style={{"display": "flex", "flexDirection": "column", "gap": "6px", "marginTop": "4px"}}>
                                <div style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                                  {"Kompetenznachweise"}
                                </div>
                                {dcList(v.apprDetail?.docs).map((d, $index) => (<React.Fragment key={$index}>
                                  <div style={{"display": "flex", "gap": "8px", "alignItems": "center", "fontSize": "13px"}}>
                                    <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(d?.color)}`)}></span>
                                    <span>
                                      {dcText(d?.label)}
                                    </span>
                                    <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
                                      {dcText(d?.state)}
                                    </span>
                                  </div>
                                </React.Fragment>))}
                              </div>
                              {"\n                "}
                            </div>
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.schools) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Berufsschulen"} style={{"display": "flex", "flexDirection": "column", "gap": "12px", "maxWidth": "1000px"}}>
                    {"\n        "}
                    <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                      {"Jede Berufsschule ist einem ÜK-Standort zugeordnet – dem nächstgelegenen. Der Schultag ist für die Planung hart: an diesem Wochentag findet kein ÜK statt."}
                    </div>
                    {"\n        "}
                    <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                      {"\n          "}
                      <div style={{"display": "grid", "gridTemplateColumns": "minmax(160px,1.4fr) minmax(140px,1fr) 110px 110px", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                        <span>
                          {"Berufsschule"}
                        </span>
                        <span>
                          {"ÜK-Standort"}
                        </span>
                        <span>
                          {"Schultag"}
                        </span>
                        <span>
                          {"Lernende"}
                        </span>
                      </div>
                      {"\n          "}
                      {dcList(v.schoolRows).map((s, $index) => (<React.Fragment key={$index}>
                        {"\n            "}
                        <div style={{"display": "grid", "gridTemplateColumns": "minmax(160px,1.4fr) minmax(140px,1fr) 110px 110px", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center", "fontSize": "13px"}}>
                          {"\n              "}
                          <span style={{"fontWeight": "500"}}>
                            {dcText(s?.name)}
                          </span>
                          {"\n              "}
                          <span>
                            <select value={dcVal(s?.loc, "value")} onChange={s?.setLoc} aria-label={"ÜK-Standort"} style={{"fontSize": "13px", "paddingBlock": "6px", "paddingInline": "10px 28px", "minHeight": "32px", "maxWidth": "100%"}}>
                              {dcList(v.ukLocs).map((l, $index) => (<React.Fragment key={$index}>
                                <option value={dcVal(l?.id, "value")}>
                                  {dcText(l?.name)}
                                </option>
                              </React.Fragment>))}
                            </select>
                          </span>
                          {"\n              "}
                          <span>
                            <select value={dcVal(s?.day, "value")} onChange={s?.setDay} aria-label={"Schultag"} style={{"fontSize": "13px", "paddingBlock": "6px", "paddingInline": "10px 28px", "minHeight": "32px", "maxWidth": "100%"}}>
                              {dcList(v.weekdayOptions).map((d, $index) => (<React.Fragment key={$index}>
                                <option value={dcVal(d?.n, "value")}>
                                  {dcText(d?.label)}
                                </option>
                              </React.Fragment>))}
                            </select>
                          </span>
                          {"\n              "}
                          <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                            {dcText(s?.count)}
                          </span>
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </React.Fragment>))}
                      {"\n        "}
                    </div>
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.locations) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Standorte"} style={{"display": "flex", "flexDirection": "column", "gap": "14px"}}>
                    {"\n        "}
                    {(v.noLocDetail) ? (<>
                      {"\n          "}
                      <input value={dcVal(v.locSearch, "value")} onChange={v.setLocSearch} placeholder={"Standort suchen…"} aria-label={"Standort suchen"} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)", "maxWidth": "340px"}} />
                      {"\n          "}
                      <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                        {"\n            "}
                        <div style={{"display": "grid", "gridTemplateColumns": "minmax(160px,1fr) 80px 90px minmax(160px,1.4fr)", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                          <span>
                            {"Standort"}
                          </span>
                          <span>
                            {"Räume"}
                          </span>
                          <span>
                            {"Kontakt"}
                          </span>
                          <span>
                            {"Berufsschulen"}
                          </span>
                        </div>
                        {"\n            "}
                        {dcList(v.locRows).map((l, $index) => (<React.Fragment key={$index}>
                          {"\n              "}
                          <button onClick={l?.open} style={{"display": "grid", "gridTemplateColumns": "minmax(160px,1fr) 80px 90px minmax(160px,1.4fr)", "gap": "12px", "padding": "var(--pad) 16px", "border": "0", "borderBottom": "1px solid var(--line)", "background": "none", "textAlign": "start", "cursor": "pointer", "alignItems": "center", "width": "100%"}} className={"scp2"}>
                            {"\n                "}
                            <span style={{"display": "flex", "alignItems": "center", "gap": "8px", "minWidth": "0"}}>
                              <span style={{"minWidth": "0"}}>
                                <span style={{"display": "block", "fontWeight": "500"}}>
                                  {dcText(l?.name)}
                                </span>
                                <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)"}}>
                                  {dcText(l?.address)}
                                </span>
                              </span>
                              {(l?.uk) ? (<>
                                <span style={{"fontSize": "11px", "border": "1px solid var(--line)", "borderRadius": "999px", "padding": "1px 8px", "whiteSpace": "nowrap"}}>
                                  {"ÜK"}
                                </span>
                              </>) : null}
                            </span>
                            {"\n                "}
                            <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                              {dcText(l?.roomCount)}
                            </span>
                            <span style={{"fontSize": "13px"}}>
                              {dcText(l?.contact)}
                            </span>
                            <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                              {dcText(l?.schools)}
                            </span>
                            {"\n              "}
                          </button>
                          {"\n            "}
                        </React.Fragment>))}
                        {"\n            "}
                        {(v.noLocRows) ? (<>
                          <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
                            {"Kein Standort gefunden."}
                          </div>
                        </>) : null}
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.locDetail) ? (<>
                      {"\n          "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "16px"}}>
                        {"\n            "}
                        <button onClick={v.closeLoc} style={{"alignSelf": "flex-start", "border": "0", "background": "none", "color": "var(--accent)", "cursor": "pointer", "padding": "0", "fontSize": "13px"}}>
                          {"← Alle Standorte"}
                        </button>
                        {"\n            "}
                        <div style={{"display": "flex", "gap": "16px", "alignItems": "center", "flexWrap": "wrap"}}>
                          {"\n              "}
                          <div>
                            <div style={{"fontSize": "20px", "fontWeight": "600", "letterSpacing": "-.01em"}}>
                              {dcText(v.locDetail?.name)}
                            </div>
                            <div style={{"color": "var(--muted)", "fontSize": "13px"}}>
                              {dcText(v.locDetail?.address)}{" · "}{dcText(v.locDetail?.region)}{" · Kontakt "}{dcText(v.locDetail?.contact)}
                            </div>
                          </div>
                          {"\n            "}
                        </div>
                        {"\n            "}
                        <div style={{"display": "flex", "gap": "2px", "borderBottom": "1px solid var(--line)"}}>
                          {"\n              "}
                          {dcList(v.locTabs).map((t, $index) => (<React.Fragment key={$index}>
                            <button onClick={t?.go} style={cssToObj(`border:0;background:none;padding:8px 14px;cursor:pointer;color:${dcStr(t?.color)};font-weight:${dcStr(t?.weight)};border-bottom:2px solid ${dcStr(t?.line)};margin-bottom:-1px`)}>
                              {dcText(t?.label)}
                            </button>
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n            "}
                        {(v.locTab?.rooms) ? (<>
                          {"\n              "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                            {"\n                "}
                            <div style={{"display": "grid", "gridTemplateColumns": "minmax(140px,1fr) 140px 100px 120px 1fr", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                              <span>
                                {"Raum"}
                              </span>
                              <span>
                                {"Art"}
                              </span>
                              <span>
                                {"Plätze"}
                              </span>
                              <span>
                                {"Belegung KW "}{dcText(v.locKw)}
                              </span>
                              <span>
                                {"Nächste Nutzung"}
                              </span>
                            </div>
                            {"\n                "}
                            {dcList(v.locDetail?.roomRows).map((r, $index) => (<React.Fragment key={$index}>
                              {"\n                  "}
                              <div style={{"display": "grid", "gridTemplateColumns": "minmax(140px,1fr) 140px 100px 120px 1fr", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center"}}>
                                <span style={{"fontWeight": "500"}}>
                                  {dcText(r?.name)}
                                </span>
                                <span style={{"fontSize": "13px"}}>
                                  {dcText(r?.kind)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(r?.cap)}
                                </span>
                                <span style={{"display": "flex", "gap": "3px"}}>
                                  {dcList(r?.week).map((d, $index) => (<React.Fragment key={$index}>
                                    <span title={d?.title} style={cssToObj(`flex:1;height:8px;border-radius:2px;background:${dcStr(d?.color)}`)}></span>
                                  </React.Fragment>))}
                                </span>
                                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                  {dcText(r?.next)}
                                </span>
                              </div>
                              {"\n                "}
                            </React.Fragment>))}
                            {"\n                "}
                            {(v.canEdit) ? (<>
                              {"\n                  "}
                              <div style={{"padding": "12px 16px", "background": "var(--surface2)", "display": "flex"}}>
                                <button onClick={v.openRoomDialog} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "7px 12px", "cursor": "pointer", "fontSize": "13px"}} className={"scp4"}>
                                  {"Raum hinzufügen"}
                                </button>
                              </div>
                              {"\n                "}
                            </>) : null}
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n            "}
                        {(v.locTab?.devices) ? (<>
                          {"\n              "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                            {"\n                "}
                            <div style={{"display": "grid", "gridTemplateColumns": "120px minmax(140px,1fr) 120px 110px 1fr", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                              <span>
                                {"Inventar"}
                              </span>
                              <span>
                                {"Typ"}
                              </span>
                              <span>
                                {"Mobilität"}
                              </span>
                              <span>
                                {"Status"}
                              </span>
                              <span>
                                {"Verfügbarkeit hier"}
                              </span>
                            </div>
                            {"\n                "}
                            {dcList(v.locDetail?.devRows).map((d, $index) => (<React.Fragment key={$index}>
                              {"\n                  "}
                              <div style={{"display": "grid", "gridTemplateColumns": "120px minmax(140px,1fr) 120px 110px 1fr", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center", "fontSize": "13px"}}>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(d?.inv)}
                                </span>
                                <span style={{"fontWeight": "500"}}>
                                  {dcText(d?.type)}
                                </span>
                                <span style={cssToObj(`font-size:12px;border-radius:999px;padding:2px 8px;background:${dcStr(d?.mobSoft)};color:${dcStr(d?.mobColor)};justify-self:start`)}>
                                  {dcText(d?.mobility)}
                                </span>
                                <span style={{"display": "flex", "gap": "6px", "alignItems": "center", "fontSize": "12px"}}>
                                  <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(d?.color)}`)}></span>
                                  {dcText(d?.status)}
                                </span>
                                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                                  {dcText(d?.avail)}
                                </span>
                              </div>
                              {"\n                "}
                            </React.Fragment>))}
                            {"\n                "}
                            {(v.locDetail?.noDevices) ? (<>
                              <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
                                {"Keine Geräte an diesem Standort."}
                              </div>
                            </>) : null}
                            {"\n                "}
                            <div style={{"padding": "12px 16px", "background": "var(--surface2)", "display": "flex", "gap": "8px", "alignItems": "center", "fontSize": "12px", "color": "var(--muted)"}}>
                              <span>
                                {"Mobile Geräte und Mietgeräte werden unter «Geräte» verschoben oder hinzugefügt."}
                              </span>
                              <button onClick={v.goDevices} style={{"marginInlineStart": "auto", "border": "0", "background": "none", "color": "var(--accent)", "cursor": "pointer", "fontSize": "12px", "padding": "0"}}>
                                {"Zu den Geräten"}
                              </button>
                            </div>
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n            "}
                        {(v.locTab?.occupancy) ? (<>
                          {"\n              "}
                          <div style={{"display": "flex", "flexDirection": "column", "gap": "12px"}}>
                            {"\n                "}
                            <div style={{"display": "flex", "gap": "8px", "alignItems": "center", "flexWrap": "wrap"}}>
                              {"\n                  "}
                              <div style={{"display": "flex", "border": "1px solid var(--line2)", "borderRadius": "var(--r)", "overflow": "hidden"}}>
                                <button onClick={v.locCal?.prev} aria-label={"Zurück"} style={{"border": "0", "background": "var(--surface)", "padding": "6px 12px", "cursor": "pointer"}} className={"scp2"}>
                                  {"‹"}
                                </button>
                                <button onClick={v.locCal?.today} style={{"border": "0", "borderInline": "1px solid var(--line2)", "background": "var(--surface)", "padding": "6px 12px", "cursor": "pointer", "fontSize": "13px"}} className={"scp2"}>
                                  {"Heute"}
                                </button>
                                <button onClick={v.locCal?.next} aria-label={"Weiter"} style={{"border": "0", "background": "var(--surface)", "padding": "6px 12px", "cursor": "pointer"}} className={"scp2"}>
                                  {"›"}
                                </button>
                              </div>
                              {"\n                  "}
                              <div style={{"fontWeight": "600", "fontSize": "15px"}}>
                                {"KW "}{dcText(v.locKw)}
                              </div>
                              <div style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                                {dcText(v.locCal?.range)}
                              </div>
                              {"\n                  "}
                              <div style={{"marginInlineStart": "auto", "display": "flex", "gap": "10px", "flexWrap": "wrap"}}>
                                {dcList(v.locCal?.devSummary).map((d, $index) => (<React.Fragment key={$index}>
                                  <span style={cssToObj(`font-size:12px;border:1px solid var(--line);border-radius:999px;padding:3px 10px;color:${dcStr(d?.color)}`)}>
                                    {dcText(d?.label)}
                                  </span>
                                </React.Fragment>))}
                              </div>
                              {"\n                "}
                            </div>
                            {"\n                "}
                            <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                              <div style={{"display": "grid", "gridTemplateColumns": "150px repeat(6,minmax(130px,1fr))", "minWidth": "940px"}}>
                                {"\n                  "}
                                <div style={{"padding": "10px 12px", "borderBottom": "1px solid var(--line)", "fontSize": "12px", "color": "var(--muted)"}}>
                                  {"Raum"}
                                </div>
                                {"\n                  "}
                                {dcList(v.locCal?.days).map((d, $index) => (<React.Fragment key={$index}>
                                  <div style={cssToObj(`padding:10px 12px;border-bottom:1px solid var(--line);border-inline-start:1px solid var(--line);background:${dcStr(d?.bg)}`)}>
                                    <span style={{"fontWeight": "600", "fontSize": "13px"}}>
                                      {dcText(d?.wd)}
                                    </span>
                                    {" "}
                                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                                      {dcText(d?.date)}
                                    </span>
                                  </div>
                                </React.Fragment>))}
                                {"\n                  "}
                                {dcList(v.locCal?.rows).map((r, $index) => (<React.Fragment key={$index}>
                                  {"\n                    "}
                                  <div style={{"padding": "10px 12px", "borderBottom": "1px solid var(--line)", "display": "flex", "flexDirection": "column", "gap": "2px"}}>
                                    <span style={{"fontWeight": "500"}}>
                                      {dcText(r?.name)}
                                    </span>
                                    <span style={{"fontSize": "11px", "color": "var(--muted)"}}>
                                      {dcText(r?.kind)}{" · "}{dcText(r?.cap)}{" Pl."}
                                    </span>
                                  </div>
                                  {"\n                    "}
                                  {dcList(r?.cells).map((cell, $index) => (<React.Fragment key={$index}>
                                    {"\n                      "}
                                    <div style={cssToObj(`padding:6px;border-bottom:1px solid var(--line);border-inline-start:1px solid var(--line);display:flex;flex-direction:column;gap:4px;min-height:56px;background:${dcStr(cell?.bg)}`)}>
                                      {"\n                        "}
                                      {dcList(cell?.items).map((it, $index) => (<React.Fragment key={$index}>
                                        <button onClick={it?.open} style={cssToObj(`text-align:start;border:0;border-radius:var(--r);padding:5px 8px;font-size:11px;line-height:1.35;background:var(--surface);border-inline-start:3px solid ${dcStr(it?.color)};cursor:pointer;display:flex;flex-direction:column;gap:1px;box-shadow:0 1px 2px oklch(0 0 0/.06)`)} className={"scp11"}>
                                          <span style={{"fontFamily": "var(--mono)", "color": "var(--muted)"}}>
                                            {dcText(it?.time)}
                                          </span>
                                          <span style={{"fontWeight": "600"}}>
                                            {dcText(it?.code)}{" · "}{dcText(it?.label)}
                                          </span>
                                          <span style={{"color": "var(--muted)"}}>
                                            {dcText(it?.instr)}
                                          </span>
                                        </button>
                                      </React.Fragment>))}
                                      {"\n                      "}
                                    </div>
                                    {"\n                    "}
                                  </React.Fragment>))}
                                  {"\n                  "}
                                </React.Fragment>))}
                                {"\n                "}
                              </div>
                            </div>
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </>) : null}
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.devices) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Geräte"} style={{"display": "flex", "flexDirection": "column", "gap": "14px"}}>
                    {"\n        "}
                    <div style={{"display": "flex", "gap": "8px", "flexWrap": "wrap", "alignItems": "center"}}>
                      {"\n          "}
                      <select value={dcVal(v.devFilterType, "value")} onChange={v.setDevFilterType} aria-label={"Gerätetyp"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                        <option value={""}>
                          {"Alle Typen"}
                        </option>
                        {dcList(v.devTypeOptions).map((t, $index) => (<React.Fragment key={$index}>
                          <option value={dcVal(t?.id, "value")}>
                            {dcText(t?.name)}
                          </option>
                        </React.Fragment>))}
                      </select>
                      {"\n          "}
                      <select value={dcVal(v.devFilterLoc, "value")} onChange={v.setDevFilterLoc} aria-label={"Standort"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                        <option value={""}>
                          {"Alle Standorte"}
                        </option>
                        {dcList(v.locs).map((l, $index) => (<React.Fragment key={$index}>
                          <option value={dcVal(l?.id, "value")}>
                            {dcText(l?.name)}
                          </option>
                        </React.Fragment>))}
                      </select>
                      {"\n          "}
                      <select value={dcVal(v.devFilterMob, "value")} onChange={v.setDevFilterMob} aria-label={"Mobilität"} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                        <option value={""}>
                          {"Fest, mobil und Miete"}
                        </option>
                        <option value={"fest"}>
                          {"Fest am Standort"}
                        </option>
                        <option value={"mobil"}>
                          {"Mobil"}
                        </option>
                        <option value={"miete"}>
                          {"Miete / Zukauf"}
                        </option>
                      </select>
                      {"\n          "}
                      {(v.canEdit) ? (<>
                        <div style={{"marginInlineStart": "auto", "display": "flex", "gap": "8px"}}>
                          <button onClick={v.openRent} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}} className={"scp4"}>
                            {"Mietgerät hinzufügen"}
                          </button>
                        </div>
                      </>) : null}
                      {"\n        "}
                    </div>
                    {"\n        "}
                    <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(160px,1fr))", "gap": "12px"}}>
                      {"\n          "}
                      {dcList(v.devKpis).map((k, $index) => (<React.Fragment key={$index}>
                        <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px", "display": "flex", "flexDirection": "column", "gap": "4px"}}>
                          <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                            {dcText(k?.label)}
                          </div>
                          <div style={cssToObj(`font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;color:${dcStr(k?.color)}`)}>
                            {dcText(k?.value)}
                          </div>
                        </div>
                      </React.Fragment>))}
                      {"\n        "}
                    </div>
                    {"\n        "}
                    <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
                      <div style={{"minWidth": "960px"}}>
                        {"\n          "}
                        <div style={{"display": "grid", "gridTemplateColumns": "110px minmax(140px,1fr) 130px 120px 110px minmax(160px,1.4fr) 90px auto", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                          <span>
                            {"Inventar"}
                          </span>
                          <span>
                            {"Typ"}
                          </span>
                          <span>
                            {"Standort heute"}
                          </span>
                          <span>
                            {"Mobilität"}
                          </span>
                          <span>
                            {"Status"}
                          </span>
                          <span>
                            {"Zeitraum / Bewegung"}
                          </span>
                          <span>
                            {"Einsätze"}
                          </span>
                          <span></span>
                        </div>
                        {"\n          "}
                        {dcList(v.devRows).map((d, $index) => (<React.Fragment key={$index}>
                          {"\n            "}
                          <div style={{"display": "grid", "gridTemplateColumns": "110px minmax(140px,1fr) 130px 120px 110px minmax(160px,1.4fr) 90px auto", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center", "fontSize": "13px"}}>
                            {"\n              "}
                            <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                              {dcText(d?.inv)}
                            </span>
                            <span style={{"fontWeight": "500"}}>
                              {dcText(d?.type)}
                            </span>
                            <span>
                              {dcText(d?.locName)}
                            </span>
                            {"\n              "}
                            <span style={cssToObj(`font-size:12px;border-radius:999px;padding:2px 8px;background:${dcStr(d?.mobSoft)};color:${dcStr(d?.mobColor)};justify-self:start`)}>
                              {dcText(d?.mobility)}
                            </span>
                            {"\n              "}
                            <span style={{"display": "flex", "gap": "6px", "alignItems": "center", "fontSize": "12px"}}>
                              <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(d?.color)}`)}></span>
                              {dcText(d?.status)}
                            </span>
                            {"\n              "}
                            <span style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                              {dcText(d?.timeline)}
                            </span>
                            {"\n              "}
                            <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                              {dcText(d?.reservations)}
                            </span>
                            {"\n              "}
                            <span style={{"display": "flex", "gap": "6px", "justifyContent": "flex-end"}}>
                              {(d?.canMove) ? (<>
                                <button onClick={d?.move} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "whiteSpace": "nowrap"}} className={"scp4"}>
                                  {"Verschieben"}
                                </button>
                              </>) : null}
                              {(d?.canReturn) ? (<>
                                <button onClick={d?.ret} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "whiteSpace": "nowrap"}} className={"scp10"}>
                                  {"Rückgabe"}
                                </button>
                              </>) : null}
                            </span>
                            {"\n            "}
                          </div>
                          {"\n          "}
                        </React.Fragment>))}
                        {"\n        "}
                      </div>
                    </div>
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.import) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Import"} style={{"display": "flex", "flexDirection": "column", "gap": "16px", "maxWidth": "900px"}}>
                    {"\n        "}
                    <div style={{"display": "flex", "gap": "0", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden", "background": "var(--surface)"}}>
                      {"\n          "}
                      {dcList(v.importSteps).map((s, $index) => (<React.Fragment key={$index}>
                        <div style={cssToObj(`flex:1;padding:12px 16px;display:flex;gap:10px;align-items:center;border-inline-end:1px solid var(--line);background:${dcStr(s?.bg)}`)}>
                          <span style={cssToObj(`width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:600;background:${dcStr(s?.dotBg)};color:${dcStr(s?.dotColor)}`)}>
                            {dcText(s?.n)}
                          </span>
                          <span style={cssToObj(`font-weight:500;color:${dcStr(s?.color)}`)}>
                            {dcText(s?.label)}
                          </span>
                        </div>
                      </React.Fragment>))}
                      {"\n        "}
                    </div>
                    {"\n        "}
                    {(v.importStep1) ? (<>
                      {"\n          "}
                      <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(260px,1fr))", "gap": "12px"}}>
                        {"\n            "}
                        {dcList(v.importSources).map((s, $index) => (<React.Fragment key={$index}>
                          {"\n              "}
                          <button onClick={s?.pick} style={cssToObj(`text-align:start;background:var(--surface);border:1px solid ${dcStr(s?.border)};border-radius:var(--r2);padding:16px;display:flex;flex-direction:column;gap:6px;cursor:pointer`)} className={"scp1"}>
                            <span style={{"fontWeight": "600"}}>
                              {dcText(s?.label)}
                            </span>
                            <span style={{"fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                              {dcText(s?.desc)}
                            </span>
                            <span style={{"fontFamily": "var(--mono)", "fontSize": "11px", "color": "var(--muted)"}}>
                              {dcText(s?.file)}
                            </span>
                          </button>
                          {"\n            "}
                        </React.Fragment>))}
                        {"\n          "}
                      </div>
                      {"\n          "}
                      {(v.importIsSchool) ? (<>
                        {"\n            "}
                        <div style={{"display": "flex", "flexDirection": "column", "gap": "10px"}}>
                          {"\n              "}
                          <div style={{"display": "flex", "gap": "10px", "alignItems": "center", "flexWrap": "wrap"}}>
                            {"\n                "}
                            <span style={{"fontSize": "13px", "fontWeight": "600"}}>
                              {"Meldestand der Berufsschulen"}
                            </span>
                            {"\n                "}
                            <select value={dcVal(v.importYear, "value")} onChange={v.setImportYear} aria-label={"Schuljahr"} style={{"fontSize": "13px", "paddingBlock": "7px", "paddingInline": "10px 30px", "minHeight": "34px", "maxWidth": "100%"}}>
                              {dcList(v.importYears).map((y, $index) => (<React.Fragment key={$index}>
                                <option>
                                  {dcText(y)}
                                </option>
                              </React.Fragment>))}
                            </select>
                            {"\n                "}
                            <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
                              {dcText(v.importYearSummary)}
                            </span>
                            {"\n              "}
                          </div>
                          {"\n              "}
                          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                            {"\n                "}
                            <div style={{"display": "grid", "gridTemplateColumns": "minmax(160px,1.4fr) 110px 120px 110px auto", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                              <span>
                                {"Berufsschule"}
                              </span>
                              <span>
                                {"Standort"}
                              </span>
                              <span>
                                {"Eingegangen"}
                              </span>
                              <span>
                                {"Lernende"}
                              </span>
                              <span>
                                {"Status"}
                              </span>
                            </div>
                            {"\n                "}
                            {dcList(v.schoolImportRows).map((r, $index) => (<React.Fragment key={$index}>
                              {"\n                  "}
                              <div style={cssToObj(`display:grid;grid-template-columns:minmax(160px,1.4fr) 110px 120px 110px auto;gap:12px;padding:var(--pad) 16px;border-bottom:1px solid var(--line);align-items:center;font-size:13px;background:${dcStr(r?.bg)}`)}>
                                {"\n                    "}
                                <span style={{"fontWeight": "500"}}>
                                  {dcText(r?.name)}
                                </span>
                                <span>
                                  {dcText(r?.locName)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                                  {dcText(r?.date)}
                                </span>
                                <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                                  {dcText(r?.rows)}
                                </span>
                                {"\n                    "}
                                <span style={{"display": "flex", "gap": "8px", "alignItems": "center", "justifyContent": "flex-end"}}>
                                  <span style={cssToObj(`display:flex;gap:6px;align-items:center;font-size:12px;color:${dcStr(r?.color)}`)}>
                                    <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(r?.color)}`)}></span>
                                    {dcText(r?.status)}
                                  </span>
                                  {(r?.canImport) ? (<>
                                    <button onClick={r?.start} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "whiteSpace": "nowrap"}} className={"scp4"}>
                                      {"Datei erfassen"}
                                    </button>
                                  </>) : null}
                                </span>
                                {"\n                  "}
                              </div>
                              {"\n                "}
                            </React.Fragment>))}
                            {"\n              "}
                          </div>
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </>) : null}
                      {"\n          "}
                      <div style={{"border": "1px dashed var(--line2)", "borderRadius": "var(--r2)", "padding": "28px", "textAlign": "center", "color": "var(--muted)", "fontSize": "13px", "background": "repeating-linear-gradient(135deg,transparent 0 10px,oklch(0 0 0/.02) 10px 20px)"}}>
                        {"Datei hierher ziehen oder auswählen · CSV, XLSX"}
                      </div>
                      {"\n          "}
                      <button onClick={v.importNext} style={{"alignSelf": "flex-end", "background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                        {"Weiter zur Spaltenzuordnung"}
                      </button>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.importStep2) ? (<>
                      {"\n          "}
                      <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                        {"\n            "}
                        <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr 1fr", "gap": "12px", "padding": "10px 16px", "borderBottom": "1px solid var(--line)", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                          <span>
                            {"Spalte in Datei"}
                          </span>
                          <span>
                            {"Beispielwert"}
                          </span>
                          <span>
                            {"Feld im Tool"}
                          </span>
                        </div>
                        {"\n            "}
                        {dcList(v.mappingRows).map((m, $index) => (<React.Fragment key={$index}>
                          <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr 1fr", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center"}}>
                            <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                              {dcText(m?.src)}
                            </span>
                            <span style={{"fontSize": "13px", "color": "var(--muted)"}}>
                              {dcText(m?.sample)}
                            </span>
                            <select defaultValue={m?.target} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                              <option>
                                {"Externe ID"}
                              </option>
                              <option>
                                {"Vorname"}
                              </option>
                              <option>
                                {"Nachname"}
                              </option>
                              <option>
                                {"Geburtsdatum"}
                              </option>
                              <option>
                                {"Track"}
                              </option>
                              <option>
                                {"Jahrgang"}
                              </option>
                              <option>
                                {"Lehrbetrieb"}
                              </option>
                              <option>
                                {"Sprache"}
                              </option>
                              <option>
                                {"— ignorieren —"}
                              </option>
                            </select>
                          </div>
                        </React.Fragment>))}
                        {"\n          "}
                      </div>
                      {"\n          "}
                      <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                        <button onClick={v.importBack} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                          {"Zurück"}
                        </button>
                        <button onClick={v.importNext} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                          {"Vorschau prüfen"}
                        </button>
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.importStep3) ? (<>
                      {"\n          "}
                      <div style={{"display": "grid", "gridTemplateColumns": "repeat(4,1fr)", "gap": "12px"}}>
                        {"\n            "}
                        <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px"}}>
                          <div style={{"fontSize": "24px", "fontWeight": "600", "fontVariantNumeric": "tabular-nums"}}>
                            {"128"}
                          </div>
                          <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                            {"Zeilen gelesen"}
                          </div>
                        </div>
                        {"\n            "}
                        <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px"}}>
                          <div style={{"fontSize": "24px", "fontWeight": "600", "color": "var(--ok)", "fontVariantNumeric": "tabular-nums"}}>
                            {"31"}
                          </div>
                          <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                            {"neu"}
                          </div>
                        </div>
                        {"\n            "}
                        <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px"}}>
                          <div style={{"fontSize": "24px", "fontWeight": "600", "fontVariantNumeric": "tabular-nums"}}>
                            {"94"}
                          </div>
                          <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                            {"aktualisiert"}
                          </div>
                        </div>
                        {"\n            "}
                        <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px"}}>
                          <div style={{"fontSize": "24px", "fontWeight": "600", "color": "var(--warn)", "fontVariantNumeric": "tabular-nums"}}>
                            {"3"}
                          </div>
                          <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                            {"zu prüfen"}
                          </div>
                        </div>
                        {"\n          "}
                      </div>
                      {"\n          "}
                      <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                        {"\n            "}
                        <div style={{"padding": "12px 16px", "borderBottom": "1px solid var(--line)", "fontWeight": "600"}}>
                          {"Fehlerbericht"}
                        </div>
                        {"\n            "}
                        {dcList(v.importIssues).map((i, $index) => (<React.Fragment key={$index}>
                          <div style={{"display": "grid", "gridTemplateColumns": "60px 1fr auto", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "alignItems": "center", "fontSize": "13px"}}>
                            <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                              {"Z. "}{dcText(i?.row)}
                            </span>
                            <span style={{"textWrap": "pretty"}}>
                              {dcText(i?.msg)}
                            </span>
                            <span style={cssToObj(`font-size:12px;color:${dcStr(i?.color)}`)}>
                              {dcText(i?.kind)}
                            </span>
                          </div>
                        </React.Fragment>))}
                        {"\n          "}
                      </div>
                      {"\n          "}
                      <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end", "alignItems": "center"}}>
                        <span style={{"fontSize": "12px", "color": "var(--muted)", "marginInlineEnd": "auto"}}>
                          {"Bestehende Datensätze werden aktualisiert, nie dupliziert. Herkunft wird pro Zeile gespeichert."}
                        </span>
                        <button onClick={v.importBack} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                          {"Zurück"}
                        </button>
                        <button onClick={v.importRun} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                          {"Import ausführen"}
                        </button>
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n        "}
                    {(v.importDone) ? (<>
                      {"\n          "}
                      <div style={{"background": "var(--ok-soft)", "color": "var(--ok)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "6px"}}>
                        <div style={{"fontWeight": "600"}}>
                          {"Import abgeschlossen"}
                        </div>
                        <div style={{"fontSize": "13px"}}>
                          {"Batch "}{dcText(v.importBatchId)}{" · 31 neue, 94 aktualisierte Lernende."}
                        </div>
                        <button onClick={v.goApprentices} style={{"alignSelf": "flex-start", "marginTop": "6px", "border": "1px solid currentColor", "background": "none", "color": "inherit", "borderRadius": "var(--r)", "padding": "6px 12px", "fontSize": "13px", "cursor": "pointer"}}>
                          {"Zu den Lernenden"}
                        </button>
                      </div>
                      {"\n        "}
                    </>) : null}
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.settings) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Einstellungen"} style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(320px,1fr))", "gap": "16px", "alignItems": "start"}}>
                    {"\n        "}
                    <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "display": "flex", "flexDirection": "column"}}>
                      {"\n          "}
                      <div style={{"padding": "14px 16px", "borderBottom": "1px solid var(--line)"}}>
                        <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
                          {"Regeln der Matching-Engine"}
                        </h2>
                        <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                          {"Ohne Deployment änderbar"}
                        </div>
                      </div>
                      {"\n          "}
                      <div style={{"padding": "16px", "display": "flex", "flexDirection": "column", "gap": "16px"}}>
                        {"\n            "}
                        <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                          <span style={{"display": "flex", "justifyContent": "space-between", "fontSize": "13px"}}>
                            <span>
                              {"Warnfrist Zertifikate"}
                            </span>
                            <span style={{"fontFamily": "var(--mono)"}}>
                              {dcText(v.warnDays)}{" Tage"}
                            </span>
                          </span>
                          <input type={"range"} min={"14"} max={"180"} step={"1"} value={dcVal(v.warnDays, "value")} onChange={v.setWarnDays} style={{"accentColor": "var(--accent)"}} />
                        </label>
                        {"\n            "}
                        <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                          <span style={{"display": "flex", "justifyContent": "space-between", "fontSize": "13px"}}>
                            <span>
                              {"Vorlauf «Kurs ohne Ausbilder»"}
                            </span>
                            <span style={{"fontFamily": "var(--mono)"}}>
                              {dcText(v.leadWeeks)}{" Wochen"}
                            </span>
                          </span>
                          <input type={"range"} min={"1"} max={"8"} step={"1"} value={dcVal(v.leadWeeks, "value")} onChange={v.setLeadWeeks} style={{"accentColor": "var(--accent)"}} />
                        </label>
                        {"\n            "}
                        <div style={{"borderTop": "1px solid var(--line)", "paddingTop": "12px", "display": "flex", "flexDirection": "column", "gap": "8px"}}>
                          {"\n              "}
                          <div style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                            {"Harte Regeln (blockieren)"}
                          </div>
                          {"\n              "}
                          {dcList(v.hardRules).map((r, $index) => (<React.Fragment key={$index}>
                            <div style={{"display": "flex", "gap": "10px", "fontSize": "13px", "alignItems": "center"}}>
                              <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--bad)"}}></span>
                              {dcText(r)}
                            </div>
                          </React.Fragment>))}
                          {"\n              "}
                          <div style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500", "marginTop": "6px"}}>
                            {"Weiche Regeln (bewerten)"}
                          </div>
                          {"\n              "}
                          {dcList(v.softRules).map((r, $index) => (<React.Fragment key={$index}>
                            <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr auto", "gap": "10px", "fontSize": "13px", "alignItems": "center"}}>
                              <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--warn)"}}></span>
                              <span>
                                {dcText(r?.label)}
                              </span>
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
                                {dcText(r?.weight)}
                              </span>
                            </div>
                          </React.Fragment>))}
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </div>
                      {"\n        "}
                    </section>
                    {"\n        "}
                    <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "display": "flex", "flexDirection": "column"}}>
                      {"\n          "}
                      <div style={{"padding": "14px 16px", "borderBottom": "1px solid var(--line)"}}>
                        <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
                          {"Rollen und Rechte"}
                        </h2>
                        <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                          {"Zuweisung im Identitätsanbieter, Durchsetzung im Backend"}
                        </div>
                      </div>
                      {"\n          "}
                      {dcList(v.roleRows).map((r, $index) => (<React.Fragment key={$index}>
                        <div style={{"display": "grid", "gridTemplateColumns": "120px 1fr", "gap": "12px", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "fontSize": "13px"}}>
                          <span style={{"fontWeight": "500"}}>
                            {dcText(r?.role)}
                          </span>
                          <span>
                            <span style={{"display": "block"}}>
                              {dcText(r?.sees)}
                            </span>
                            <span style={{"display": "block", "color": "var(--muted)"}}>
                              {"Ändert: "}{dcText(r?.edits)}
                            </span>
                          </span>
                        </div>
                      </React.Fragment>))}
                      {"\n        "}
                    </section>
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.myProfile) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Profil & Zertifikate"} style={{"display": "flex", "flexDirection": "column", "gap": "16px", "maxWidth": "900px"}}>
                    {"\n        "}
                    <div style={{"display": "flex", "gap": "16px", "alignItems": "center", "flexWrap": "wrap"}}>
                      {"\n          "}
                      <div style={{"width": "52px", "height": "52px", "borderRadius": "50%", "background": "var(--accent-soft)", "color": "var(--accent)", "display": "grid", "placeItems": "center", "fontSize": "18px", "fontWeight": "600"}}>
                        {dcText(v.me?.initials)}
                      </div>
                      {"\n          "}
                      <div>
                        <div style={{"fontSize": "20px", "fontWeight": "600", "letterSpacing": "-.01em"}}>
                          {dcText(v.me?.name)}
                        </div>
                        <div style={{"color": "var(--muted)", "fontSize": "13px"}}>
                          {dcText(v.me?.employment)}{" · Heimstandort "}{dcText(v.me?.locName)}{" · Sprachen "}{dcText(v.me?.langs)}
                        </div>
                      </div>
                      {"\n        "}
                    </div>
                    {"\n        "}
                    <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(280px,1fr))", "gap": "16px"}}>
                      {"\n          "}
                      <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                        <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
                          {"Skills"}
                        </h2>
                        <div style={{"display": "flex", "flexWrap": "wrap", "gap": "6px"}}>
                          {dcList(v.me?.skillList).map((s, $index) => (<React.Fragment key={$index}>
                            <span style={{"border": "1px solid var(--line)", "borderRadius": "999px", "padding": "4px 10px", "fontSize": "12px"}}>
                              {dcText(s)}
                            </span>
                          </React.Fragment>))}
                        </div>
                        <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                          {"Änderungen an Skills nimmt die Planung vor."}
                        </div>
                      </section>
                      {"\n          "}
                      <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                        <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
                          {"Präferenzen"}
                        </h2>
                        <div style={{"display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "6px 12px", "fontSize": "13px"}}>
                          <span style={{"color": "var(--muted)"}}>
                            {"Bevorzugt"}
                          </span>
                          <span>
                            {dcText(v.me?.prefLocs)}
                          </span>
                          <span style={{"color": "var(--muted)"}}>
                            {"Max. Reise"}
                          </span>
                          <span>
                            {dcText(v.me?.maxTravel)}
                          </span>
                        </div>
                      </section>
                      {"\n        "}
                    </div>
                    {"\n        "}
                    <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                      {"\n          "}
                      <div style={{"display": "flex", "alignItems": "center", "padding": "14px 16px", "borderBottom": "1px solid var(--line)"}}>
                        <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
                          {"Zertifikate"}
                        </h2>
                        <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
                          {"Nachweis als PDF hochladen, Prüfung durch die Planung"}
                        </span>
                      </div>
                      {"\n          "}
                      {dcList(v.myCerts).map((c, $index) => (<React.Fragment key={$index}>
                        {"\n            "}
                        <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr 110px 120px auto", "gap": "12px", "alignItems": "center", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)"}}>
                          <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(c?.color)}`)}></span>
                          <span>
                            <span style={{"display": "block", "fontWeight": "500"}}>
                              {dcText(c?.name)}
                            </span>
                            <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)"}}>
                              {dcText(c?.issuer)}
                            </span>
                          </span>
                          <span style={{"fontFamily": "var(--mono)", "fontSize": "12px"}}>
                            {dcText(c?.until)}
                          </span>
                          <span style={cssToObj(`font-size:12px;color:${dcStr(c?.color)}`)}>
                            {dcText(c?.status)}
                          </span>
                          <button onClick={c?.renew} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "5px 10px", "fontSize": "12px", "cursor": "pointer", "whiteSpace": "nowrap"}} className={"scp4"}>
                            {"Erneuerung melden"}
                          </button>
                        </div>
                        {"\n          "}
                      </React.Fragment>))}
                      {"\n        "}
                    </section>
                    {"\n        "}
                    <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
                      {"\n          "}
                      <div style={{"display": "flex", "alignItems": "center", "padding": "14px 16px", "borderBottom": "1px solid var(--line)"}}>
                        <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
                          {"Qualifikationspflege"}
                        </h2>
                        <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
                          {"Kalenderjahr 2026 · gezählt werden geleitete Kurse"}
                        </span>
                      </div>
                      {"\n          "}
                      {dcList(v.myMaint).map((m, $index) => (<React.Fragment key={$index}>
                        {"\n            "}
                        <div style={{"padding": "14px 16px", "borderBottom": "1px solid var(--line)", "display": "grid", "gridTemplateColumns": "minmax(0,1fr) auto", "gap": "8px 16px", "alignItems": "center"}}>
                          {"\n              "}
                          <div style={{"display": "flex", "flexDirection": "column", "gap": "2px"}}>
                            <span style={{"fontWeight": "500"}}>
                              {dcText(m?.label)}
                            </span>
                            <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                              {"Voraussetzung für "}{dcText(m?.cert)}
                            </span>
                          </div>
                          {"\n              "}
                          <span style={cssToObj(`font-size:12px;font-weight:500;color:${dcStr(m?.color)};background:${dcStr(m?.soft)};border-radius:999px;padding:3px 10px;white-space:nowrap`)}>
                            {dcText(m?.statusLabel)}
                          </span>
                          {"\n              "}
                          <div style={{"gridColumn": "1 / -1", "display": "grid", "gridTemplateColumns": "1fr auto", "gap": "12px", "alignItems": "center"}}>
                            {"\n                "}
                            <span style={{"height": "8px", "background": "var(--surface2)", "borderRadius": "999px", "overflow": "hidden", "display": "flex"}}>
                              <span style={cssToObj(`display:block;height:100%;width:${dcStr(m?.histPct)}%;background:${dcStr(m?.color)}`)}></span>
                              <span style={cssToObj(`display:block;height:100%;width:${dcStr(m?.plannedPct)}%;background:${dcStr(m?.color)};opacity:.45`)}></span>
                            </span>
                            {"\n                "}
                            <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "fontVariantNumeric": "tabular-nums"}}>
                              {dcText(m?.count)}{" / "}{dcText(m?.min)}
                            </span>
                            {"\n              "}
                          </div>
                          {"\n              "}
                          <div style={{"gridColumn": "1 / -1", "display": "flex", "gap": "14px", "flexWrap": "wrap", "fontSize": "12px", "color": "var(--muted)"}}>
                            <span>
                              {dcText(m?.hist)}{" durchgeführt"}
                            </span>
                            <span>
                              {dcText(m?.planned)}{" geplant"}
                            </span>
                            <span style={cssToObj(`color:${dcStr(m?.color)}`)}>
                              {dcText(m?.openLabel)}
                            </span>
                            {(m?.showAsk) ? (<>
                              <button onClick={m?.ask} style={{"marginInlineStart": "auto", "border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "color": "var(--ink)"}} className={"scp4"}>
                                {"Einsatz bei der Planung anfragen"}
                              </button>
                            </>) : null}
                          </div>
                          {"\n            "}
                        </div>
                        {"\n          "}
                      </React.Fragment>))}
                      {"\n          "}
                      {(v.noMyMaint) ? (<>
                        <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
                          {"Keine Pflichten zur Qualifikationserhaltung."}
                        </div>
                      </>) : null}
                      {"\n        "}
                    </section>
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.assignments) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Einsätze"} style={{"display": "flex", "flexDirection": "column", "gap": "14px"}}>
                    {"\n        "}
                    <div className="sc-host"><Einsatzkalender cal={v.cal} rows={v.myAssignments} leadCount={v.myAssignCount} backupCount={v.myBackupCount} empty={v.noMyAssignments} /></div>
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
                {"\n    "}
                {(v.show?.myVacation) ? (<>
                  {"\n      "}
                  <div data-screen-label={"Ferien"} style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(300px,1fr))", "gap": "16px", "alignItems": "start", "maxWidth": "900px"}}>
                    {"\n        "}
                    <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "display": "flex", "flexDirection": "column"}}>
                      {"\n          "}
                      <div style={{"padding": "14px 16px", "borderBottom": "1px solid var(--line)"}}>
                        <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
                          {"Ferien beantragen"}
                        </h2>
                      </div>
                      {"\n          "}
                      <form onSubmit={v.requestVacation} style={{"padding": "16px", "display": "flex", "flexDirection": "column", "gap": "12px"}}>
                        {"\n            "}
                        <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                          <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                            {"Kalenderwoche"}
                          </span>
                          <select value={dcVal(v.vacKw, "value")} onChange={v.setVacKw} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                            {dcList(v.weeks).map((w, $index) => (<React.Fragment key={$index}>
                              <option value={dcVal(w?.kw, "value")}>
                                {"KW "}{dcText(w?.kw)}{" · "}{dcText(w?.range)}
                              </option>
                            </React.Fragment>))}
                          </select>
                        </label>
                        {"\n            "}
                        <div style={cssToObj(`font-size:12px;color:${dcStr(v.vacHintColor)};text-wrap:pretty`)}>
                          {dcText(v.vacHint)}
                        </div>
                        {"\n            "}
                        <button type={"submit"} style={{"alignSelf": "flex-start", "background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                          {"Antrag senden"}
                        </button>
                        {"\n            "}
                        {(v.vacMsg) ? (<>
                          <div style={{"fontSize": "13px", "color": "var(--ok)"}}>
                            {dcText(v.vacMsg)}
                          </div>
                        </>) : null}
                        {"\n          "}
                      </form>
                      {"\n        "}
                    </section>
                    {"\n        "}
                    <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "display": "flex", "flexDirection": "column"}}>
                      {"\n          "}
                      <div style={{"padding": "14px 16px", "borderBottom": "1px solid var(--line)"}}>
                        <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
                          {"Meine Anträge und Abwesenheiten"}
                        </h2>
                      </div>
                      {"\n          "}
                      {dcList(v.myAbs).map((a, $index) => (<React.Fragment key={$index}>
                        <div style={{"display": "grid", "gridTemplateColumns": "1fr auto auto", "gap": "12px", "alignItems": "center", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)", "fontSize": "13px"}}>
                          <span>
                            <span style={{"fontWeight": "500"}}>
                              {dcText(a?.kind)}
                            </span>
                            <span style={{"color": "var(--muted)"}}>
                              {" · "}{dcText(a?.range)}
                            </span>
                          </span>
                          <span style={cssToObj(`color:${dcStr(a?.color)};font-size:12px`)}>
                            {dcText(a?.status)}
                          </span>
                          <span>
                            {(a?.pending) ? (<>
                              <button onClick={a?.withdraw} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer"}} className={"scp10"}>
                                {"Zurückziehen"}
                              </button>
                            </>) : null}
                          </span>
                        </div>
                      </React.Fragment>))}
                      {"\n          "}
                      {(v.noMyAbs) ? (<>
                        <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
                          {"Keine Abwesenheiten im Zeitraum."}
                        </div>
                      </>) : null}
                      {"\n        "}
                    </section>
                    {"\n      "}
                  </div>
                  {"\n    "}
                </>) : null}
                {"\n\n    "}
              </div>
              {"\n  "}
            </main>
            {"\n\n  "}
            {"\n  "}
            {(v.assistantVisible) ? (<>
              {"\n    "}
              <aside aria-label={"KI-Assistent"} style={{"width": "360px", "borderInlineStart": "1px solid var(--line)", "background": "var(--surface)", "display": "flex", "flexDirection": "column", "position": "sticky", "top": "0", "height": "100vh", "animation": "slideIn .25s cubic-bezier(0.2,0,0,1)"}}>
                {"\n      "}
                <div style={{"display": "flex", "alignItems": "center", "gap": "10px", "padding": "14px 16px", "borderBottom": "1px solid var(--line)"}}>
                  <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--accent)"}}></span>
                  <div>
                    <div style={{"fontWeight": "600", "fontSize": "14px"}}>
                      {"Assistent"}
                    </div>
                    <div style={{"fontSize": "11px", "color": "var(--muted)"}}>
                      {"Schlägt vor und begründet – Sie bestätigen"}
                    </div>
                  </div>
                  <button onClick={v.toggleAssistant} aria-label={"Schliessen"} style={{"marginInlineStart": "auto", "border": "0", "background": "none", "color": "var(--muted)", "cursor": "pointer", "fontSize": "18px", "lineHeight": "1", "padding": "4px 6px", "borderRadius": "var(--r)"}} className={"scp2"}>
                    {"×"}
                  </button>
                </div>
                {"\n      "}
                <div style={{"flex": "1", "overflow": "auto", "padding": "16px", "display": "flex", "flexDirection": "column", "gap": "12px"}}>
                  {"\n        "}
                  {dcList(v.messages).map((m, $index) => (<React.Fragment key={$index}>
                    {"\n          "}
                    <div style={cssToObj(`display:flex;flex-direction:column;gap:8px;align-items:${dcStr(m?.align)}`)}>
                      {"\n            "}
                      <div style={cssToObj(`max-width:92%;border-radius:var(--r2);padding:10px 12px;font-size:13px;line-height:1.5;white-space:pre-wrap;text-wrap:pretty;background:${dcStr(m?.bg)};color:${dcStr(m?.color)}`)}>
                        {dcText(m?.text)}
                      </div>
                      {"\n            "}
                      {(m?.card) ? (<>
                        {"\n              "}
                        <div style={{"width": "100%", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "background": "var(--surface)", "overflow": "hidden"}}>
                          {"\n                "}
                          <div style={{"padding": "10px 12px", "borderBottom": "1px solid var(--line)", "display": "flex", "flexDirection": "column", "gap": "2px"}}>
                            <span style={{"fontWeight": "600", "fontSize": "13px"}}>
                              {dcText(m?.card?.title)}
                            </span>
                            <span style={{"fontSize": "11px", "color": "var(--muted)", "textWrap": "pretty"}}>
                              {dcText(m?.card?.subtitle)}
                            </span>
                          </div>
                          {"\n                "}
                          {dcList(m?.card?.rows).map((r, $index) => (<React.Fragment key={$index}>
                            <div style={{"display": "grid", "gridTemplateColumns": "96px 1fr", "gap": "10px", "padding": "6px 12px", "fontSize": "12px", "borderBottom": "1px solid var(--line)"}}>
                              <span style={{"color": "var(--muted)"}}>
                                {dcText(r?.label)}
                              </span>
                              <span style={cssToObj(`color:${dcStr(r?.color)};word-break:break-word`)}>
                                {dcText(r?.value)}
                              </span>
                            </div>
                          </React.Fragment>))}
                          {"\n                "}
                          {dcList(m?.card?.list).map((it, $index) => (<React.Fragment key={$index}>
                            {"\n                  "}
                            <div style={{"display": "grid", "gridTemplateColumns": "1fr auto", "gap": "8px", "padding": "8px 12px", "borderBottom": "1px solid var(--line)", "alignItems": "center"}}>
                              {"\n                    "}
                              <span style={{"minWidth": "0"}}>
                                <span style={{"display": "block", "fontSize": "12px", "fontWeight": "500"}}>
                                  {dcText(it?.title)}
                                </span>
                                <span style={{"display": "block", "fontSize": "11px", "color": "var(--muted)", "textWrap": "pretty"}}>
                                  {dcText(it?.sub)}
                                </span>
                              </span>
                              {"\n                    "}
                              <span style={{"display": "flex", "flexDirection": "column", "gap": "4px", "alignItems": "flex-end"}}>
                                <span style={cssToObj(`font-family:var(--mono);font-size:11px;color:${dcStr(it?.metaColor)};white-space:nowrap`)}>
                                  {dcText(it?.meta)}
                                </span>
                                {(it?.action) ? (<>
                                  <button onClick={it?.action?.run} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "3px 8px", "fontSize": "11px", "cursor": "pointer", "whiteSpace": "nowrap"}} className={"scp4"}>
                                    {dcText(it?.action?.label)}
                                  </button>
                                </>) : null}
                              </span>
                              {"\n                  "}
                            </div>
                            {"\n                "}
                          </React.Fragment>))}
                          {"\n                "}
                          {dcList(m?.card?.bars).map((b, $index) => (<React.Fragment key={$index}>
                            <div style={{"display": "grid", "gridTemplateColumns": "80px 1fr 40px", "gap": "8px", "alignItems": "center", "padding": "6px 12px", "fontSize": "12px", "borderBottom": "1px solid var(--line)"}}>
                              <span>
                                {dcText(b?.name)}
                              </span>
                              <span style={{"height": "6px", "background": "var(--surface2)", "borderRadius": "999px", "overflow": "hidden"}}>
                                <span style={cssToObj(`display:block;height:100%;width:${dcStr(b?.pct)}%;background:${dcStr(b?.color)}`)}></span>
                              </span>
                              <span style={{"fontFamily": "var(--mono)", "fontSize": "11px", "textAlign": "end"}}>
                                {dcText(b?.pct)}{"%"}
                              </span>
                            </div>
                          </React.Fragment>))}
                          {"\n                "}
                          {(m?.card?.chipsShown) ? (<>
                            <div style={{"display": "flex", "flexWrap": "wrap", "gap": "4px", "padding": "8px 12px", "borderBottom": "1px solid var(--line)"}}>
                              {dcList(m?.card?.chips).map((ch, $index) => (<React.Fragment key={$index}>
                                <span style={{"border": "1px solid var(--line)", "borderRadius": "999px", "padding": "2px 8px", "fontSize": "11px"}}>
                                  {dcText(ch)}
                                </span>
                              </React.Fragment>))}
                            </div>
                          </>) : null}
                          {"\n                "}
                          {(m?.card?.empty) ? (<>
                            <div style={{"padding": "10px 12px", "fontSize": "12px", "color": "var(--muted)", "textWrap": "pretty"}}>
                              {dcText(m?.card?.empty)}
                            </div>
                          </>) : null}
                          {"\n                "}
                          {(m?.card?.actionsShown) ? (<>
                            <div style={{"display": "flex", "gap": "6px", "padding": "8px 12px", "flexWrap": "wrap"}}>
                              {dcList(m?.card?.actions).map((a, $index) => (<React.Fragment key={$index}>
                                <button onClick={a?.run} style={{"border": "0", "background": "none", "color": "var(--accent)", "cursor": "pointer", "padding": "0", "fontSize": "12px"}}>
                                  {dcText(a?.label)}
                                </button>
                              </React.Fragment>))}
                            </div>
                          </>) : null}
                          {"\n              "}
                        </div>
                        {"\n            "}
                      </>) : null}
                      {"\n          "}
                    </div>
                    {"\n        "}
                  </React.Fragment>))}
                  {"\n        "}
                  {(v.thinking) ? (<>
                    <div style={{"fontSize": "12px", "color": "var(--muted)"}}>
                      {"Prüfe Regeln …"}
                    </div>
                  </>) : null}
                  {"\n      "}
                </div>
                {"\n      "}
                <div style={{"padding": "12px 16px", "borderTop": "1px solid var(--line)", "display": "flex", "flexDirection": "column", "gap": "8px"}}>
                  {"\n        "}
                  <div style={{"display": "flex", "flexWrap": "wrap", "gap": "4px"}}>
                    {dcList(v.suggestions).map((s, $index) => (<React.Fragment key={$index}>
                      <button onClick={s?.ask} style={{"border": "1px solid var(--line)", "background": "var(--surface)", "borderRadius": "999px", "padding": "4px 10px", "fontSize": "12px", "cursor": "pointer", "textAlign": "start"}} className={"scp4"}>
                        {dcText(s?.label)}
                      </button>
                    </React.Fragment>))}
                  </div>
                  {"\n        "}
                  <form onSubmit={v.sendMessage} style={{"display": "flex", "gap": "6px"}}>
                    <input value={dcVal(v.draft, "value")} onChange={v.setDraft} placeholder={"Frage auf Deutsch stellen…"} aria-label={"Frage"} style={{"flex": "1", "border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "8px 10px", "background": "var(--surface)", "minWidth": "0"}} />
                    <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 12px", "cursor": "pointer"}}>
                      {"Senden"}
                    </button>
                  </form>
                  {"\n      "}
                </div>
                {"\n    "}
              </aside>
              {"\n  "}
            </>) : null}
          </div>
          {(v.sel) ? (<>
            {"\n  "}
            <div onClick={v.closeCourse} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <aside role={"dialog"} aria-modal={"true"} aria-label={"Kursdetails"} style={{"position": "fixed", "top": "0", "right": "0", "bottom": "0", "width": "min(560px,100vw)", "background": "var(--surface)", "borderInlineStart": "1px solid var(--line)", "zIndex": "21", "display": "flex", "flexDirection": "column", "animation": "slideIn .25s cubic-bezier(0.2,0,0,1)", "boxShadow": "-8px 0 24px oklch(0 0 0/.08)"}}>
              {"\n    "}
              <div style={{"display": "flex", "alignItems": "start", "gap": "12px", "padding": "16px 20px", "borderBottom": "1px solid var(--line)"}}>
                {"\n      "}
                <div style={{"display": "flex", "flexDirection": "column", "gap": "4px", "minWidth": "0"}}>
                  <div style={{"display": "flex", "gap": "8px", "alignItems": "center"}}>
                    <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "background": "var(--surface2)", "borderRadius": "var(--r)", "padding": "2px 6px"}}>
                      {dcText(v.sel?.code)}
                    </span>
                    <span style={cssToObj(`display:flex;gap:6px;align-items:center;font-size:12px;color:${dcStr(v.sel?.color)}`)}>
                      <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(v.sel?.color)}`)}></span>
                      {dcText(v.sel?.statusLabel)}
                    </span>
                  </div>
                  <div style={{"fontSize": "18px", "fontWeight": "600", "letterSpacing": "-.01em"}}>
                    {dcText(v.sel?.name)}
                  </div>
                  <div style={{"fontSize": "13px", "color": "var(--muted)"}}>
                    {dcText(v.sel?.locName)}{" · KW "}{dcText(v.sel?.kw)}{" · "}{dcText(v.sel?.days)}{" · Sprache "}{dcText(v.sel?.lang)}{" · "}{dcText(v.sel?.enrolled)}{"/"}{dcText(v.sel?.max)}{" Teilnehmende"}
                  </div>
                </div>
                {"\n      "}
                <button onClick={v.closeCourse} aria-label={"Schliessen"} style={{"marginInlineStart": "auto", "border": "0", "background": "none", "color": "var(--muted)", "cursor": "pointer", "fontSize": "20px", "lineHeight": "1", "padding": "4px 8px", "borderRadius": "var(--r)"}} className={"scp2"}>
                  {"×"}
                </button>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={{"flex": "1", "overflow": "auto", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "20px"}}>
                {"\n      "}
                <section style={{"display": "flex", "flexDirection": "column", "gap": "8px"}}>
                  {"\n        "}
                  <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                    <h3 style={{"margin": "0", "fontSize": "13px", "fontWeight": "600"}}>
                      {"Zugewiesener Ausbilder"}
                    </h3>
                    {(v.sel?.timeWindow) ? (<>
                      <span style={{"marginInlineStart": "auto", "fontSize": "11px", "color": "var(--muted)"}}>
                        {"Zeitfenster "}{dcText(v.sel?.timeWindow)}
                      </span>
                    </>) : null}
                  </div>
                  {"\n        "}
                  {(v.sel?.instr) ? (<>
                    {"\n          "}
                    <div style={{"border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "12px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
                      {"\n            "}
                      <div style={{"display": "flex", "gap": "10px", "alignItems": "center"}}>
                        <span style={{"width": "32px", "height": "32px", "borderRadius": "50%", "background": "var(--accent-soft)", "color": "var(--accent)", "display": "grid", "placeItems": "center", "fontSize": "12px", "fontWeight": "600"}}>
                          {dcText(v.sel?.instr?.initials)}
                        </span>
                        <span>
                          <span style={{"display": "block", "fontWeight": "500"}}>
                            {dcText(v.sel?.instr?.name)}
                          </span>
                          <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)"}}>
                            {dcText(v.sel?.instr?.employment)}{" · "}{dcText(v.sel?.instr?.locName)}
                          </span>
                        </span>
                        <span style={cssToObj(`margin-inline-start:auto;font-size:12px;font-weight:500;color:${dcStr(v.sel?.instr?.verdictColor)}`)}>
                          {dcText(v.sel?.instr?.verdict)}
                        </span>
                      </div>
                      {"\n            "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "4px"}}>
                        {dcList(v.sel?.instr?.checks).map((k, $index) => (<React.Fragment key={$index}>
                          <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr", "gap": "10px", "alignItems": "start", "fontSize": "12px"}}>
                            <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(k?.color)};margin-top:5px`)}></span>
                            <span style={{"textWrap": "pretty"}}>
                              <span style={{"fontWeight": "500"}}>
                                {dcText(k?.label)}
                              </span>
                              {" "}
                              <span style={{"color": "var(--muted)"}}>
                                {dcText(k?.reason)}
                              </span>
                            </span>
                          </div>
                        </React.Fragment>))}
                      </div>
                      {"\n            "}
                      {(v.canEdit) ? (<>
                        <button onClick={v.sel?.unassign} style={{"alignSelf": "flex-start", "border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "5px 10px", "fontSize": "12px", "cursor": "pointer"}} className={"scp10"}>
                          {"Zuweisung aufheben"}
                        </button>
                      </>) : null}
                      {"\n          "}
                    </div>
                    {"\n        "}
                  </>) : null}
                  {"\n        "}
                  {(v.sel?.noInstr) ? (<>
                    <div style={{"border": "1px dashed var(--line2)", "borderRadius": "var(--r2)", "padding": "12px", "fontSize": "13px", "color": "var(--warn)"}}>
                      {"Noch kein Ausbilder zugewiesen."}
                    </div>
                  </>) : null}
                  {"\n      "}
                </section>
                {"\n      "}
                <section style={{"display": "flex", "flexDirection": "column", "gap": "8px"}}>
                  {"\n        "}
                  <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                    <h3 style={{"margin": "0", "fontSize": "13px", "fontWeight": "600"}}>
                      {"Geräte"}
                    </h3>
                    <span style={cssToObj(`margin-inline-start:auto;font-size:12px;color:${dcStr(v.sel?.devColor)}`)}>
                      {dcText(v.sel?.devSummary)}
                    </span>
                  </div>
                  {"\n        "}
                  {dcList(v.sel?.devRows).map((d, $index) => (<React.Fragment key={$index}>
                    <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr auto", "gap": "10px", "alignItems": "center", "fontSize": "13px"}}>
                      <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(d?.color)}`)}></span>
                      <span>
                        {dcText(d?.n)}{" × "}{dcText(d?.type)}
                      </span>
                      <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                        {dcText(d?.avail)}
                      </span>
                    </div>
                  </React.Fragment>))}
                  {"\n        "}
                  {(v.sel?.noDevs) ? (<>
                    <div style={{"fontSize": "13px", "color": "var(--muted)"}}>
                      {"Keine Geräte erforderlich."}
                    </div>
                  </>) : null}
                  {"\n      "}
                </section>
                {"\n      "}
                <section style={{"display": "flex", "flexDirection": "column", "gap": "8px"}}>
                  {"\n        "}
                  <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                    <h3 style={{"margin": "0", "fontSize": "13px", "fontWeight": "600"}}>
                      {"Kandidaten (Matching-Engine)"}
                    </h3>
                    <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
                      {dcText(v.sel?.feasibleCount)}{" machbar von "}{dcText(v.sel?.candTotal)}
                    </span>
                  </div>
                  {"\n        "}
                  {dcList(v.sel?.cands).map((k, $index) => (<React.Fragment key={$index}>
                    {"\n          "}
                    <div style={cssToObj(`border:1px solid var(--line);border-radius:var(--r2);padding:10px 12px;display:flex;flex-direction:column;gap:8px;opacity:${dcStr(k?.opacity)}`)}>
                      {"\n            "}
                      <div style={{"display": "flex", "gap": "10px", "alignItems": "center"}}>
                        <span style={{"width": "28px", "height": "28px", "borderRadius": "50%", "background": "var(--surface2)", "display": "grid", "placeItems": "center", "fontSize": "11px", "fontWeight": "600", "color": "var(--muted)"}}>
                          {dcText(k?.initials)}
                        </span>
                        <span style={{"minWidth": "0"}}>
                          <span style={{"display": "block", "fontWeight": "500"}}>
                            {dcText(k?.name)}
                          </span>
                          <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)"}}>
                            {dcText(k?.employment)}{" · "}{dcText(k?.locName)}
                          </span>
                        </span>
                        {"\n              "}
                        <span style={{"marginInlineStart": "auto", "display": "flex", "gap": "8px", "alignItems": "center"}}>
                          {(k?.feasible) ? (<>
                            <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--ok)"}}>
                              {"Score "}{dcText(k?.score)}
                            </span>
                            {(v.canEdit) ? (<>
                              <button onClick={k?.assign} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "5px 10px", "fontSize": "12px", "cursor": "pointer", "transition": "transform .12s"}} className={"scp0"}>
                                {"Zuweisen"}
                              </button>
                            </>) : null}
                          </>) : null}
                          {(k?.infeasible) ? (<>
                            <span style={{"fontSize": "12px", "color": "var(--bad)"}}>
                              {"nicht machbar"}
                            </span>
                          </>) : null}
                        </span>
                      </div>
                      {"\n            "}
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "3px"}}>
                        {dcList(k?.reasons).map((r, $index) => (<React.Fragment key={$index}>
                          <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr", "gap": "10px", "fontSize": "12px", "alignItems": "start"}}>
                            <span style={cssToObj(`width:8px;height:8px;border-radius:50%;background:${dcStr(r?.color)};margin-top:5px`)}></span>
                            <span style={{"color": "var(--muted)", "textWrap": "pretty"}}>
                              {dcText(r?.text)}
                            </span>
                          </div>
                        </React.Fragment>))}
                      </div>
                      {"\n          "}
                    </div>
                    {"\n        "}
                  </React.Fragment>))}
                  {"\n        "}
                  {(v.sel?.noFeasible) ? (<>
                    {"\n          "}
                    <div style={{"background": "var(--warn-soft)", "borderRadius": "var(--r2)", "padding": "12px", "fontSize": "13px", "display": "flex", "flexDirection": "column", "gap": "8px"}}>
                      <div style={{"fontWeight": "500"}}>
                        {"Kein Ausbilder ist unter den aktuellen Bedingungen machbar."}
                      </div>
                      <div style={{"color": "var(--muted)", "textWrap": "pretty"}}>
                        {"Vorschläge der Engine:"}
                      </div>
                      {dcList(v.sel?.alternatives).map((a, $index) => (<React.Fragment key={$index}>
                        <button onClick={a?.apply} style={{"textAlign": "start", "border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 10px", "fontSize": "12px", "cursor": "pointer", "display": "flex", "justifyContent": "space-between", "gap": "8px"}} className={"scp1"}>
                          <span>
                            {dcText(a?.label)}
                          </span>
                          <span style={{"color": "var(--accent)", "whiteSpace": "nowrap"}}>
                            {dcText(a?.action)}
                          </span>
                        </button>
                      </React.Fragment>))}
                    </div>
                    {"\n        "}
                  </>) : null}
                  {"\n      "}
                </section>
                {"\n      "}
                <section style={{"display": "flex", "flexDirection": "column", "gap": "8px"}}>
                  {"\n        "}
                  <h3 style={{"margin": "0", "fontSize": "13px", "fontWeight": "600"}}>
                    {"Verlauf"}
                  </h3>
                  {"\n        "}
                  {dcList(v.sel?.audit).map((a, $index) => (<React.Fragment key={$index}>
                    <div style={{"display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "10px", "fontSize": "12px"}}>
                      <span style={{"fontFamily": "var(--mono)", "color": "var(--muted)", "whiteSpace": "nowrap"}}>
                        {dcText(a?.when)}
                      </span>
                      <span style={{"textWrap": "pretty"}}>
                        <span style={{"fontWeight": "500"}}>
                          {dcText(a?.who)}
                        </span>
                        {" "}{dcText(a?.what)}
                      </span>
                    </div>
                  </React.Fragment>))}
                  {"\n      "}
                </section>
                {"\n    "}
              </div>
              {"\n    "}
              {(v.canEdit) ? (<>
                {"\n    "}
                <div style={{"padding": "12px 20px", "borderTop": "1px solid var(--line)", "display": "flex", "gap": "8px", "flexWrap": "wrap"}}>
                  {"\n      "}
                  {(v.sel?.canConfirm) ? (<>
                    <button onClick={v.sel?.confirm} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                      {"Kurs bestätigen"}
                    </button>
                  </>) : null}
                  {"\n      "}
                  <button onClick={v.sel?.askAssistant} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                    {"Assistent fragen"}
                  </button>
                  {"\n      "}
                  <button onClick={v.sel?.cancel} style={{"marginInlineStart": "auto", "border": "1px solid var(--line2)", "background": "var(--surface)", "color": "var(--bad)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}} className={"scp8"}>
                    {dcText(v.sel?.cancelLabel)}
                  </button>
                  {"\n    "}
                </div>
                {"\n    "}
              </>) : null}
              {"\n  "}
            </aside>
          </>) : null}
          {(v.newCourse) ? (<>
            {"\n  "}
            <div onClick={v.closeNewCourse} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.createCourse} role={"dialog"} aria-modal={"true"} aria-label={"Kurs anlegen"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(440px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {"Kurs anlegen"}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Kurstyp"}
                </span>
                <select value={dcVal(v.newCourse?.type, "value")} onChange={v.setNewType} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  {dcList(v.typeCards).map((t, $index) => (<React.Fragment key={$index}>
                    <option value={dcVal(t?.id, "value")}>
                      {dcText(t?.code)}{" · "}{dcText(t?.name)}
                    </option>
                  </React.Fragment>))}
                </select>
              </label>
              {"\n    "}
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "10px"}}>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Standort"}
                  </span>
                  <select value={dcVal(v.newCourse?.loc, "value")} onChange={v.setNewLoc} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    {dcList(v.locs).map((l, $index) => (<React.Fragment key={$index}>
                      <option value={dcVal(l?.id, "value")}>
                        {dcText(l?.name)}
                      </option>
                    </React.Fragment>))}
                  </select>
                </label>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Kalenderwoche"}
                  </span>
                  <select value={dcVal(v.newCourse?.kw, "value")} onChange={v.setNewKw} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    {dcList(v.weeks).map((w, $index) => (<React.Fragment key={$index}>
                      <option value={dcVal(w?.kw, "value")}>
                        {"KW "}{dcText(w?.kw)}{" · "}{dcText(w?.range)}
                      </option>
                    </React.Fragment>))}
                  </select>
                </label>
                {"\n    "}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Kurssprache"}
                </span>
                <select value={dcVal(v.newCourse?.lang, "value")} onChange={v.setNewLang} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  <option value={"D"}>
                    {"Deutsch"}
                  </option>
                  <option value={"F"}>
                    {"Französisch"}
                  </option>
                  <option value={"I"}>
                    {"Italienisch"}
                  </option>
                </select>
              </label>
              {"\n    "}
              <div style={{"fontSize": "12px", "color": "var(--muted)", "background": "var(--surface2)", "borderRadius": "var(--r)", "padding": "8px 10px", "textWrap": "pretty"}}>
                {dcText(v.newCourse?.preview)}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeNewCourse} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {"Anlegen und Kandidaten prüfen"}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.propDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeProp} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <div role={"dialog"} aria-modal={"true"} aria-label={"Vorschlag"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(520px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"display": "flex", "flexDirection": "column", "gap": "4px"}}>
                {"\n      "}
                <div style={{"display": "flex", "alignItems": "baseline", "gap": "8px"}}>
                  <span style={cssToObj(`font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${dcStr(v.propDialog?.kindColor)};font-weight:600`)}>
                    {dcText(v.propDialog?.kindLabel)}
                  </span>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {dcText(v.propDialog?.subject)}
                  </span>
                  {(v.propDialog?.queueLabel) ? (<>
                    <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
                      {dcText(v.propDialog?.queueLabel)}
                    </span>
                  </>) : null}
                </div>
                {"\n      "}
                <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                  {dcText(v.propDialog?.problem)}
                </div>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={{"border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px", "display": "flex", "flexDirection": "column", "gap": "10px", "background": "var(--surface2)"}}>
                {"\n      "}
                {(v.propDialog?.total) ? (<>
                  <span style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--accent)", "fontWeight": "600"}}>
                    {"Vorschlag "}{dcText(v.propDialog?.n)}{" von "}{dcText(v.propDialog?.total)}
                  </span>
                </>) : null}
                {"\n      "}
                {(v.propDialog?.noOption) ? (<>
                  <span style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--bad)", "fontWeight": "600"}}>
                    {"Kein Vorschlag möglich"}
                  </span>
                </>) : null}
                {"\n      "}
                <div style={{"fontSize": "16px", "fontWeight": "600", "letterSpacing": "-.01em", "textWrap": "pretty"}}>
                  {dcText(v.propDialog?.title)}
                </div>
                {"\n      "}
                <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                  {dcText(v.propDialog?.why)}
                </div>
                {"\n      "}
                <div style={{"display": "flex", "flexDirection": "column", "gap": "5px"}}>
                  {dcList(v.propDialog?.effect).map((e, $index) => (<React.Fragment key={$index}>
                    <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr", "gap": "10px", "alignItems": "start", "fontSize": "13px"}}>
                      <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--accent)", "marginTop": "6px"}}></span>
                      <span style={{"textWrap": "pretty"}}>
                        {dcText(e)}
                      </span>
                    </div>
                  </React.Fragment>))}
                </div>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "flexWrap": "wrap", "alignItems": "center"}}>
                {"\n      "}
                {(v.propDialog?.hasMore) ? (<>
                  <button onClick={v.propDialog?.other} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}} className={"scp4"}>
                    {"Anderer Vorschlag"}
                  </button>
                </>) : null}
                {"\n      "}
                <div style={{"marginInlineStart": "auto", "display": "flex", "gap": "8px"}}>
                  <button onClick={v.propDialog?.skip} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                    {dcText(v.propDialog?.skipLabel)}
                  </button>
                  {"\n      "}
                  {(v.propDialog?.canApply) ? (<>
                    <button onClick={v.propDialog?.apply} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer", "transition": "transform .12s"}} className={"scp0"}>
                      {"Vorschlag übernehmen"}
                    </button>
                  </>) : null}
                </div>
                {"\n    "}
              </div>
              {"\n  "}
            </div>
          </>) : null}
          {(v.fixDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeFix} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <div role={"dialog"} aria-modal={"true"} aria-label={"Lösungsvorschlag"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(520px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"display": "flex", "flexDirection": "column", "gap": "4px"}}>
                {"\n      "}
                <div style={{"display": "flex", "alignItems": "baseline", "gap": "8px"}}>
                  <span style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--bad)", "fontWeight": "600"}}>
                    {"Konflikt"}
                  </span>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {dcText(v.fixDialog?.subject)}
                  </span>
                </div>
                {"\n      "}
                <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                  {dcText(v.fixDialog?.problem)}
                </div>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={{"border": "1px solid var(--line)", "borderRadius": "var(--r2)", "padding": "14px", "display": "flex", "flexDirection": "column", "gap": "10px", "background": "var(--surface2)"}}>
                {"\n      "}
                <div style={{"display": "flex", "alignItems": "baseline", "gap": "8px"}}>
                  <span style={{"fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--accent)", "fontWeight": "600"}}>
                    {"Vorschlag "}{dcText(v.fixDialog?.n)}{" von "}{dcText(v.fixDialog?.total)}
                  </span>
                </div>
                {"\n      "}
                <div style={{"fontSize": "16px", "fontWeight": "600", "letterSpacing": "-.01em", "textWrap": "pretty"}}>
                  {dcText(v.fixDialog?.title)}
                </div>
                {"\n      "}
                <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                  {dcText(v.fixDialog?.why)}
                </div>
                {"\n      "}
                <div style={{"display": "flex", "flexDirection": "column", "gap": "5px"}}>
                  {"\n        "}
                  {dcList(v.fixDialog?.effect).map((e, $index) => (<React.Fragment key={$index}>
                    <div style={{"display": "grid", "gridTemplateColumns": "8px 1fr", "gap": "10px", "alignItems": "start", "fontSize": "13px"}}>
                      <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--accent)", "marginTop": "6px"}}></span>
                      <span style={{"textWrap": "pretty"}}>
                        {dcText(e)}
                      </span>
                    </div>
                  </React.Fragment>))}
                  {"\n      "}
                </div>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "flexWrap": "wrap", "alignItems": "center"}}>
                {"\n      "}
                <button onClick={v.fixDialog?.other} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}} className={"scp4"}>
                  {"Anderer Vorschlag"}
                </button>
                {"\n      "}
                <div style={{"marginInlineStart": "auto", "display": "flex", "gap": "8px"}}>
                  <button onClick={v.closeFix} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                    {"Abbrechen"}
                  </button>
                  {"\n      "}
                  {(v.fixDialog?.canApply) ? (<>
                    <button onClick={v.fixDialog?.apply} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer", "transition": "transform .12s"}} className={"scp0"}>
                      {"Vorschlag übernehmen"}
                    </button>
                  </>) : null}
                  {"\n      "}
                  {(v.fixDialog?.manualOnly) ? (<>
                    <span style={{"fontSize": "12px", "color": "var(--muted)", "alignSelf": "center"}}>
                      {"Braucht eine Entscheidung ausserhalb des Tools"}
                    </span>
                  </>) : null}
                </div>
                {"\n    "}
              </div>
              {"\n  "}
            </div>
          </>) : null}
          {(v.runDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeRunDialog} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.submitRun} role={"dialog"} aria-modal={"true"} aria-label={"Planungslauf starten"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(460px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {"Neuen Planungslauf starten"}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Schuljahr"}
                </span>
                <select value={dcVal(v.runDialog?.year, "value")} onChange={v.setRunYear} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  {dcList(v.runDialog?.years).map((y, $index) => (<React.Fragment key={$index}>
                    <option>
                      {dcText(y)}
                    </option>
                  </React.Fragment>))}
                </select>
              </label>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Periode"}
                </span>
                <select value={dcVal(v.runDialog?.period, "value")} onChange={v.setRunPeriod} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  {dcList(v.runDialog?.periods).map((p, $index) => (<React.Fragment key={$index}>
                    <option value={dcVal(p?.id, "value")}>
                      {dcText(p?.label)}{" · "}{dcText(p?.months)}
                    </option>
                  </React.Fragment>))}
                </select>
              </label>
              {"\n    "}
              <div style={cssToObj(`font-size:12px;color:${dcStr(v.runDialog?.hintColor)};background:var(--surface2);border-radius:var(--r);padding:8px 10px;text-wrap:pretty`)}>
                {dcText(v.runDialog?.hint)}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeRunDialog} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {"Lauf anlegen"}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.contactDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeContactDialog} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.submitContact} role={"dialog"} aria-modal={"true"} aria-label={"Kontakt bearbeiten"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(440px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {"Kontakt bearbeiten"}
              </div>
              {"\n    "}
              <div style={{"fontSize": "13px", "color": "var(--muted)"}}>
                {dcText(v.contactDialog?.name)}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"E-Mail"}
                </span>
                <input type={"email"} value={dcVal(v.contactDialog?.email, "value")} onChange={v.setContactEmail} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
              </label>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Telefon"}
                </span>
                <input value={dcVal(v.contactDialog?.phone, "value")} onChange={v.setContactPhone} placeholder={"+41 79 000 00 00"} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
              </label>
              {"\n    "}
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "10px"}}>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Max. Reise"}
                  </span>
                  <select value={dcVal(v.contactDialog?.travel, "value")} onChange={v.setContactTravel} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    <option>
                      {"30 min"}
                    </option>
                    <option>
                      {"45 min"}
                    </option>
                    <option>
                      {"60 min"}
                    </option>
                    <option>
                      {"90 min"}
                    </option>
                    <option>
                      {"120 min"}
                    </option>
                  </select>
                </label>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Bevorzugte Standorte"}
                  </span>
                  <input value={dcVal(v.contactDialog?.pref, "value")} onChange={v.setContactPref} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
                </label>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeContactDialog} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {"Speichern"}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.roomDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeRoomDialog} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.submitRoom} role={"dialog"} aria-modal={"true"} aria-label={"Raum hinzufügen"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(420px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {"Raum hinzufügen"}
              </div>
              {"\n    "}
              <div style={{"fontSize": "13px", "color": "var(--muted)"}}>
                {dcText(v.roomDialog?.locName)}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Bezeichnung"}
                </span>
                <input value={dcVal(v.roomDialog?.name, "value")} onChange={v.setRoomName} placeholder={"z. B. Raum 2.05"} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
              </label>
              {"\n    "}
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 110px", "gap": "10px"}}>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Art"}
                  </span>
                  <select value={dcVal(v.roomDialog?.kind, "value")} onChange={v.setRoomKind} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    <option>
                      {"Theorieraum"}
                    </option>
                    <option>
                      {"Praxishalle"}
                    </option>
                    <option>
                      {"Aussenfläche"}
                    </option>
                  </select>
                </label>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Plätze"}
                  </span>
                  <input type={"number"} min={"4"} max={"40"} value={dcVal(v.roomDialog?.cap, "value")} onChange={v.setRoomCap} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
                </label>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeRoomDialog} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {"Hinzufügen"}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.skillDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeSkillDialog} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.submitSkill} role={"dialog"} aria-modal={"true"} aria-label={"Skill hinzufügen"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(420px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {"Skill hinzufügen"}
              </div>
              {"\n    "}
              <div style={{"fontSize": "13px", "color": "var(--muted)"}}>
                {dcText(v.skillDialog?.name)}{" · Skills sind harte Voraussetzung für die Zuweisung."}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Skill aus dem Katalog"}
                </span>
                <select value={dcVal(v.skillDialog?.skill, "value")} onChange={v.setSkillValue} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  {dcList(v.skillDialog?.options).map((o, $index) => (<React.Fragment key={$index}>
                    <option>
                      {dcText(o)}
                    </option>
                  </React.Fragment>))}
                </select>
              </label>
              {"\n    "}
              {(v.skillDialog?.unlocks) ? (<>
                <div style={{"fontSize": "12px", "color": "var(--muted)", "background": "var(--surface2)", "borderRadius": "var(--r)", "padding": "8px 10px", "textWrap": "pretty"}}>
                  {dcText(v.skillDialog?.unlocks)}
                </div>
              </>) : null}
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeSkillDialog} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {"Hinzufügen"}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.certDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeCertDialog} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.submitCert} role={"dialog"} aria-modal={"true"} aria-label={"Zertifikat erfassen"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(440px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {"Zertifikat erfassen"}
              </div>
              {"\n    "}
              <div style={{"fontSize": "13px", "color": "var(--muted)"}}>
                {dcText(v.certDialog?.name)}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Zertifikatstyp"}
                </span>
                <select value={dcVal(v.certDialog?.type, "value")} onChange={v.setCertType} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  {dcList(v.certDialog?.options).map((o, $index) => (<React.Fragment key={$index}>
                    <option value={dcVal(o?.id, "value")}>
                      {dcText(o?.label)}
                    </option>
                  </React.Fragment>))}
                </select>
              </label>
              {"\n    "}
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "10px"}}>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Ausgestellt am"}
                  </span>
                  <input type={"date"} value={dcVal(v.certDialog?.issued, "value")} onChange={v.setCertIssued} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
                </label>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Gültig bis"}
                  </span>
                  <input type={"date"} value={dcVal(v.certDialog?.until, "value")} onChange={v.setCertUntil} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
                </label>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={{"fontSize": "12px", "color": "var(--muted)", "background": "var(--surface2)", "borderRadius": "var(--r)", "padding": "8px 10px", "textWrap": "pretty"}}>
                {dcText(v.certDialog?.hint)}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeCertDialog} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {"Erfassen"}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.absDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeAbs} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.submitAbs} role={"dialog"} aria-modal={"true"} aria-label={"Absenz erfassen"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(460px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {"Absenz erfassen"}
              </div>
              {"\n    "}
              <div style={{"fontSize": "13px", "color": "var(--muted)"}}>
                {"Für jeden betroffenen Einsatz wird ein Ersatz vorgeschlagen – Sie entscheiden. Offen gelassene Kurse erscheinen unter «Braucht eine Entscheidung»."}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Ausbilder"}
                </span>
                <select value={dcVal(v.absDialog?.instr, "value")} onChange={v.setAbsInstr} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  {dcList(v.instrOptions).map((i, $index) => (<React.Fragment key={$index}>
                    <option value={dcVal(i?.id, "value")}>
                      {dcText(i?.name)}
                    </option>
                  </React.Fragment>))}
                </select>
              </label>
              {"\n    "}
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "10px"}}>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Kalenderwoche"}
                  </span>
                  <select value={dcVal(v.absDialog?.kw, "value")} onChange={v.setAbsKw} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    {dcList(v.weeks).map((w, $index) => (<React.Fragment key={$index}>
                      <option value={dcVal(w?.kw, "value")}>
                        {"KW "}{dcText(w?.kw)}{" · "}{dcText(w?.range)}
                      </option>
                    </React.Fragment>))}
                  </select>
                </label>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Grund"}
                  </span>
                  <select value={dcVal(v.absDialog?.kind, "value")} onChange={v.setAbsKind} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    <option>
                      {"Krankheit"}
                    </option>
                    <option>
                      {"Ferien"}
                    </option>
                    <option>
                      {"Weiterbildung"}
                    </option>
                    <option>
                      {"Militär / Zivildienst"}
                    </option>
                  </select>
                </label>
                {"\n    "}
              </div>
              {"\n    "}
              <div style={cssToObj(`font-size:12px;color:${dcStr(v.absDialog?.previewColor)};background:var(--surface2);border-radius:var(--r);padding:8px 10px;text-wrap:pretty`)}>
                {dcText(v.absDialog?.preview)}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeAbs} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {"Absenz erfassen"}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.noShowDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeNoShow} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.submitNoShow} role={"dialog"} aria-modal={"true"} aria-label={"Nichterscheinen erfassen"} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(460px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {"Nichterscheinen erfassen"}
              </div>
              {"\n    "}
              <div style={{"fontSize": "13px", "color": "var(--muted)"}}>
                {"Es werden passende Folgetermine vorgeschlagen – freier Platz, passende Sprache, Standort nächst der Berufsschule. Sie wählen den Termin."}
              </div>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Lernende/r"}
                </span>
                <select value={dcVal(v.noShowDialog?.appr, "value")} onChange={v.setNoShowAppr} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  {dcList(v.apprOptions).map((a, $index) => (<React.Fragment key={$index}>
                    <option value={dcVal(a?.id, "value")}>
                      {dcText(a?.label)}
                    </option>
                  </React.Fragment>))}
                </select>
              </label>
              {"\n    "}
              <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                  {"Verpasstes Modul"}
                </span>
                <select value={dcVal(v.noShowDialog?.module, "value")} onChange={v.setNoShowModule} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                  {dcList(v.noShowDialog?.modules).map((m, $index) => (<React.Fragment key={$index}>
                    <option>
                      {dcText(m)}
                    </option>
                  </React.Fragment>))}
                </select>
              </label>
              {"\n    "}
              <div style={{"fontSize": "12px", "color": "var(--muted)", "background": "var(--surface2)", "borderRadius": "var(--r)", "padding": "8px 10px", "textWrap": "pretty"}}>
                {dcText(v.noShowDialog?.preview)}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeNoShow} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {"Erfassen"}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.devDialog) ? (<>
            {"\n  "}
            <div onClick={v.closeDevDialog} style={{"position": "fixed", "inset": "0", "background": "oklch(0 0 0/.25)", "zIndex": "20"}}></div>
            {"\n  "}
            <form onSubmit={v.submitDevDialog} role={"dialog"} aria-modal={"true"} aria-label={v.devDialog?.title} style={{"position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%,-50%) scale(1)", "width": "min(440px,calc(100vw - 32px))", "background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "zIndex": "21", "padding": "20px", "display": "flex", "flexDirection": "column", "gap": "14px", "animation": "modalIn .18s cubic-bezier(0.2,0,0,1)", "boxShadow": "0 16px 48px oklch(0 0 0/.16)"}}>
              {"\n    "}
              <div style={{"fontSize": "18px", "fontWeight": "600"}}>
                {dcText(v.devDialog?.title)}
              </div>
              {"\n    "}
              <div style={{"fontSize": "13px", "color": "var(--muted)", "textWrap": "pretty"}}>
                {dcText(v.devDialog?.desc)}
              </div>
              {"\n    "}
              {(v.devDialog?.isRent) ? (<>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Gerätetyp"}
                  </span>
                  <select value={dcVal(v.devDialog?.type, "value")} onChange={v.setDevDialogType} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    {dcList(v.devTypeOptions).map((t, $index) => (<React.Fragment key={$index}>
                      <option value={dcVal(t?.id, "value")}>
                        {dcText(t?.name)}
                      </option>
                    </React.Fragment>))}
                  </select>
                </label>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Anbieter"}
                  </span>
                  <input value={dcVal(v.devDialog?.vendor, "value")} onChange={v.setDevDialogVendor} style={{"border": "1px solid var(--line2)", "borderRadius": "var(--r)", "padding": "9px 12px", "minHeight": "38px", "background": "var(--surface)"}} />
                </label>
                {"\n    "}
              </>) : null}
              {"\n    "}
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "10px"}}>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {dcText(v.devDialog?.locLabel)}
                  </span>
                  <select value={dcVal(v.devDialog?.loc, "value")} onChange={v.setDevDialogLoc} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    {dcList(v.locs).map((l, $index) => (<React.Fragment key={$index}>
                      <option value={dcVal(l?.id, "value")}>
                        {dcText(l?.name)}
                      </option>
                    </React.Fragment>))}
                  </select>
                </label>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {dcText(v.devDialog?.fromLabel)}
                  </span>
                  <select value={dcVal(v.devDialog?.from, "value")} onChange={v.setDevDialogFrom} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    {dcList(v.weeks).map((w, $index) => (<React.Fragment key={$index}>
                      <option value={dcVal(w?.kw, "value")}>
                        {"KW "}{dcText(w?.kw)}{" · "}{dcText(w?.range)}
                      </option>
                    </React.Fragment>))}
                  </select>
                </label>
                {"\n    "}
              </div>
              {"\n    "}
              {(v.devDialog?.isRent) ? (<>
                {"\n      "}
                <label style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                  <span style={{"fontSize": "12px", "color": "var(--muted)"}}>
                    {"Bis KW"}
                  </span>
                  <select value={dcVal(v.devDialog?.until, "value")} onChange={v.setDevDialogUntil} style={{"fontSize": "14px", "paddingBlock": "9px", "paddingInline": "12px 34px", "minHeight": "38px", "maxWidth": "100%"}}>
                    {dcList(v.weeks).map((w, $index) => (<React.Fragment key={$index}>
                      <option value={dcVal(w?.kw, "value")}>
                        {"KW "}{dcText(w?.kw)}{" · "}{dcText(w?.range)}
                      </option>
                    </React.Fragment>))}
                  </select>
                </label>
                {"\n    "}
              </>) : null}
              {"\n    "}
              <div style={{"fontSize": "12px", "color": "var(--muted)", "background": "var(--surface2)", "borderRadius": "var(--r)", "padding": "8px 10px", "textWrap": "pretty"}}>
                {dcText(v.devDialog?.preview)}
              </div>
              {"\n    "}
              <div style={{"display": "flex", "gap": "8px", "justifyContent": "flex-end"}}>
                <button type={"button"} onClick={v.closeDevDialog} style={{"border": "1px solid var(--line2)", "background": "var(--surface)", "borderRadius": "var(--r)", "padding": "8px 14px", "cursor": "pointer"}}>
                  {"Abbrechen"}
                </button>
                <button type={"submit"} style={{"background": "var(--accent)", "color": "var(--accent-ink)", "border": "0", "borderRadius": "var(--r)", "padding": "8px 14px", "fontWeight": "500", "cursor": "pointer"}}>
                  {dcText(v.devDialog?.cta)}
                </button>
              </div>
              {"\n  "}
            </form>
          </>) : null}
          {(v.toast) ? (<>
            {"\n  "}
            <div role={"status"} style={{"position": "fixed", "bottom": "20px", "left": "50%", "transform": "translateX(-50%)", "background": "var(--ink)", "color": "#fff", "borderRadius": "var(--r2)", "padding": "10px 16px", "fontSize": "13px", "zIndex": "30", "maxWidth": "calc(100vw - 32px)", "animation": "toastIn .2s ease-out", "boxShadow": "0 8px 24px oklch(0 0 0/.15)"}}>
              {dcText(v.toast)}
            </div>
          </>) : null}
        </>) : null}
      </div>
    </>
  );
}
