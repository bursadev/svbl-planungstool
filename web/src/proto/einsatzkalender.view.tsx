/* eslint-disable */
// @ts-nocheck
// Generated from Einsatzkalender.dc.html by dc2jsx.py - do not edit by hand.
import React from "react";
import { cssToObj, dcList, dcText, dcVal, dcStr } from "./dc-runtime";

export function renderEinsatzkalender(v: any) {
  return (
    <>
      <div style={{"display": "flex", "flexDirection": "column", "gap": "14px"}}>
        {"\n    "}
        <div style={{"display": "flex", "gap": "8px", "alignItems": "center", "flexWrap": "wrap"}}>
          {"\n      "}
          <div style={{"display": "flex", "border": "1px solid var(--line2)", "borderRadius": "var(--r)", "overflow": "hidden"}}>
            {"\n        "}
            <button onClick={v.cal?.prev} aria-label={"Zurück"} style={{"border": "0", "background": "var(--surface)", "padding": "6px 12px", "cursor": "pointer"}} className={"scp0"}>
              {"‹"}
            </button>
            {"\n        "}
            <button onClick={v.cal?.today} style={{"border": "0", "borderInline": "1px solid var(--line2)", "background": "var(--surface)", "padding": "6px 12px", "cursor": "pointer", "fontSize": "13px"}} className={"scp0"}>
              {"Heute"}
            </button>
            {"\n        "}
            <button onClick={v.cal?.next} aria-label={"Weiter"} style={{"border": "0", "background": "var(--surface)", "padding": "6px 12px", "cursor": "pointer"}} className={"scp0"}>
              {"›"}
            </button>
            {"\n      "}
          </div>
          {"\n      "}
          <div style={{"fontWeight": "600", "fontSize": "15px", "letterSpacing": "-.01em"}}>
            {dcText(v.cal?.title)}
          </div>
          {"\n      "}
          <div style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)"}}>
            {dcText(v.cal?.subtitle)}
          </div>
          {"\n      "}
          <div style={{"marginInlineStart": "auto", "display": "flex", "gap": "12px", "alignItems": "center", "flexWrap": "wrap"}}>
            {"\n        "}
            <div style={{"display": "flex", "gap": "12px", "fontSize": "12px", "color": "var(--muted)"}}>
              <span style={{"display": "flex", "gap": "6px", "alignItems": "center"}}>
                <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--accent)"}}></span>
                {"Leitung"}
              </span>
              <span style={{"display": "flex", "gap": "6px", "alignItems": "center"}}>
                <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--alt)"}}></span>
                {"Stellvertretung"}
              </span>
              <span style={{"display": "flex", "gap": "6px", "alignItems": "center"}}>
                <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "var(--line2)"}}></span>
                {"Abwesenheit"}
              </span>
            </div>
            {"\n        "}
            <div style={{"display": "flex", "border": "1px solid var(--line2)", "borderRadius": "var(--r)", "overflow": "hidden"}}>
              <button onClick={v.cal?.setWeek} aria-pressed={v.cal?.isWeek} style={cssToObj(`border:0;padding:6px 14px;cursor:pointer;font-size:13px;background:${dcStr(v.cal?.weekBg)};color:${dcStr(v.cal?.weekColor)}`)}>
                {"Woche"}
              </button>
              <button onClick={v.cal?.setMonth} aria-pressed={v.cal?.isMonth} style={cssToObj(`border:0;border-inline-start:1px solid var(--line2);padding:6px 14px;cursor:pointer;font-size:13px;background:${dcStr(v.cal?.monthBg)};color:${dcStr(v.cal?.monthColor)}`)}>
                {"Monat"}
              </button>
            </div>
            {"\n      "}
          </div>
          {"\n    "}
        </div>
        {"\n\n    "}
        {(v.cal?.isWeek) ? (<>
          {"\n      "}
          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "auto"}}>
            {"\n        "}
            <div style={{"display": "grid", "gridTemplateColumns": "repeat(6,minmax(150px,1fr))", "minWidth": "900px"}}>
              {"\n          "}
              {dcList(v.cal?.days).map((d, $index) => (<React.Fragment key={$index}>
                {"\n            "}
                <div style={cssToObj(`border-inline-end:1px solid var(--line);display:flex;flex-direction:column;min-height:320px;background:${dcStr(d?.bg)}`)}>
                  {"\n              "}
                  <div style={{"padding": "10px 12px", "borderBottom": "1px solid var(--line)", "display": "flex", "alignItems": "baseline", "gap": "6px"}}>
                    <span style={cssToObj(`font-weight:600;font-size:13px;color:${dcStr(d?.color)}`)}>
                      {dcText(d?.wd)}
                    </span>
                    <span style={cssToObj(`font-family:var(--mono);font-size:12px;color:${dcStr(d?.color)}`)}>
                      {dcText(d?.date)}
                    </span>
                    {(d?.isToday) ? (<>
                      <span style={{"marginInlineStart": "auto", "fontSize": "10px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--accent)", "fontWeight": "600"}}>
                        {"heute"}
                      </span>
                    </>) : null}
                  </div>
                  {"\n              "}
                  <div style={{"padding": "8px", "display": "flex", "flexDirection": "column", "gap": "6px"}}>
                    {"\n                "}
                    {(d?.absence) ? (<>
                      <div style={{"borderRadius": "var(--r)", "padding": "8px 10px", "fontSize": "12px", "background": "var(--surface2)", "color": "var(--muted)", "border": "1px dashed var(--line2)"}}>
                        {dcText(d?.absence)}
                      </div>
                    </>) : null}
                    {"\n                "}
                    {dcList(d?.events).map((e, $index) => (<React.Fragment key={$index}>
                      {"\n                  "}
                      <div style={cssToObj(`border-radius:var(--r);padding:8px 10px;font-size:12px;line-height:1.4;background:${dcStr(e?.soft)};border-inline-start:3px solid ${dcStr(e?.color)};display:flex;flex-direction:column;gap:2px`)}>
                        {"\n                    "}
                        <div style={{"display": "flex", "justifyContent": "space-between", "gap": "6px"}}>
                          <span style={{"fontFamily": "var(--mono)", "color": "var(--muted)"}}>
                            {dcText(e?.time)}
                          </span>
                          <span style={cssToObj(`font-size:10px;letter-spacing:.04em;text-transform:uppercase;font-weight:600;color:${dcStr(e?.color)}`)}>
                            {dcText(e?.roleLabel)}
                          </span>
                        </div>
                        {"\n                    "}
                        <div style={{"fontWeight": "600"}}>
                          {dcText(e?.code)}{" · "}{dcText(e?.name)}
                        </div>
                        {"\n                    "}
                        <div style={{"color": "var(--muted)"}}>
                          {dcText(e?.locName)}{" · Tag "}{dcText(e?.dayNo)}{"/"}{dcText(e?.dayTotal)}{" · "}{dcText(e?.enrolled)}{" Teilnehmende"}
                        </div>
                        {"\n                    "}
                        <div style={{"display": "flex", "flexDirection": "column", "marginTop": "4px", "borderTop": "1px solid oklch(0 0 0/.08)"}}>
                          {"\n                      "}
                          {dcList(e?.blocks).map((b, $index) => (<React.Fragment key={$index}>
                            <div style={{"display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "2px 8px", "padding": "5px 0", "borderBottom": "1px solid oklch(0 0 0/.06)"}}>
                              <span style={{"fontFamily": "var(--mono)", "color": "var(--muted)", "fontSize": "11px"}}>
                                {dcText(b?.time)}
                              </span>
                              <span style={{"fontWeight": "500"}}>
                                {dcText(b?.room)}
                              </span>
                              <span></span>
                              <span style={{"color": "var(--muted)"}}>
                                {dcText(b?.label)}
                              </span>
                            </div>
                          </React.Fragment>))}
                          {"\n                    "}
                        </div>
                        {"\n                  "}
                      </div>
                      {"\n                "}
                    </React.Fragment>))}
                    {"\n              "}
                  </div>
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
        {(v.cal?.isMonth) ? (<>
          {"\n      "}
          <div style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
            {"\n        "}
            <div style={{"display": "grid", "gridTemplateColumns": "repeat(7,1fr)", "borderBottom": "1px solid var(--line)"}}>
              {"\n          "}
              {dcList(v.cal?.weekdays).map((w, $index) => (<React.Fragment key={$index}>
                <div style={{"padding": "8px 10px", "fontSize": "11px", "letterSpacing": ".06em", "textTransform": "uppercase", "color": "var(--muted)", "fontWeight": "500"}}>
                  {dcText(w)}
                </div>
              </React.Fragment>))}
              {"\n        "}
            </div>
            {"\n        "}
            <div style={{"display": "grid", "gridTemplateColumns": "repeat(7,1fr)"}}>
              {"\n          "}
              {dcList(v.cal?.cells).map((c, $index) => (<React.Fragment key={$index}>
                {"\n            "}
                <div style={cssToObj(`min-height:96px;padding:6px 8px;border-bottom:1px solid var(--line);border-inline-end:1px solid var(--line);display:flex;flex-direction:column;gap:4px;background:${dcStr(c?.bg)};opacity:${dcStr(c?.opacity)}`)}>
                  {"\n              "}
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "baseline"}}>
                    <span style={cssToObj(`font-family:var(--mono);font-size:12px;font-weight:${dcStr(c?.weight)};color:${dcStr(c?.color)}`)}>
                      {dcText(c?.day)}
                    </span>
                    {(c?.kwLabel) ? (<>
                      <button onClick={c?.goWeek} style={{"border": "0", "background": "none", "padding": "0", "fontSize": "10px", "color": "var(--muted)", "cursor": "pointer"}} className={"scp1"}>
                        {dcText(c?.kwLabel)}
                      </button>
                    </>) : null}
                  </div>
                  {"\n              "}
                  {(c?.absence) ? (<>
                    <div style={{"fontSize": "11px", "color": "var(--muted)", "border": "1px dashed var(--line2)", "borderRadius": "3px", "padding": "1px 6px", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>
                      {dcText(c?.absence)}
                    </div>
                  </>) : null}
                  {"\n              "}
                  {dcList(c?.events).map((e, $index) => (<React.Fragment key={$index}>
                    <button onClick={e?.goWeek} title={e?.title} style={cssToObj(`text-align:start;border:0;font-size:11px;border-radius:3px;padding:2px 6px;background:${dcStr(e?.soft)};color:${dcStr(e?.color)};border-inline-start:2px solid ${dcStr(e?.color)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;font-weight:500`)}>
                      {dcText(e?.code)}{" "}{dcText(e?.locName)}
                    </button>
                  </React.Fragment>))}
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
        <section style={{"background": "var(--surface)", "border": "1px solid var(--line)", "borderRadius": "var(--r2)", "overflow": "hidden"}}>
          {"\n      "}
          <div style={{"display": "flex", "alignItems": "center", "padding": "14px 16px", "borderBottom": "1px solid var(--line)"}}>
            <h2 style={{"margin": "0", "fontSize": "14px", "fontWeight": "600"}}>
              {"Alle Einsätze"}
            </h2>
            <span style={{"marginInlineStart": "auto", "fontSize": "12px", "color": "var(--muted)"}}>
              {dcText(v.leadCount)}{" als Leitung · "}{dcText(v.backupCount)}{" als Stellvertretung"}
            </span>
          </div>
          {"\n      "}
          {dcList(v.rows).map((c, $index) => (<React.Fragment key={$index}>
            {"\n        "}
            <div style={{"display": "grid", "gridTemplateColumns": "auto 1fr auto auto", "gap": "12px", "alignItems": "center", "padding": "var(--pad) 16px", "borderBottom": "1px solid var(--line)"}}>
              {"\n          "}
              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "background": "var(--surface2)", "borderRadius": "var(--r)", "padding": "2px 6px"}}>
                {dcText(c?.code)}
              </span>
              {"\n          "}
              <span>
                <span style={{"display": "block", "fontWeight": "500"}}>
                  {dcText(c?.name)}
                </span>
                <span style={{"display": "block", "fontSize": "12px", "color": "var(--muted)"}}>
                  {dcText(c?.locName)}{" · "}{dcText(c?.roomsLabel)}{" · "}{dcText(c?.enrolled)}{" Teilnehmende · Sprache "}{dcText(c?.lang)}
                </span>
              </span>
              {"\n          "}
              <span style={{"fontFamily": "var(--mono)", "fontSize": "12px", "color": "var(--muted)", "textAlign": "end"}}>
                <span style={{"display": "block"}}>
                  {dcText(c?.dateRange)}
                </span>
                <span style={{"display": "block"}}>
                  {"KW "}{dcText(c?.kw)}{" · "}{dcText(c?.dayRange)}
                </span>
              </span>
              {"\n          "}
              <span style={cssToObj(`font-size:11px;letter-spacing:.04em;text-transform:uppercase;font-weight:600;color:${dcStr(c?.roleColor)};background:${dcStr(c?.roleSoft)};border-radius:999px;padding:3px 8px`)}>
                {dcText(c?.roleLabel)}
              </span>
              {"\n        "}
            </div>
            {"\n      "}
          </React.Fragment>))}
          {"\n      "}
          {(v.empty) ? (<>
            <div style={{"padding": "16px", "color": "var(--muted)", "fontSize": "13px"}}>
              {"Keine Einsätze im Zeitraum."}
            </div>
          </>) : null}
          {"\n    "}
        </section>
      </div>
    </>
  );
}
