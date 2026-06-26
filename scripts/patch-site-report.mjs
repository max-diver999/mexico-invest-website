import { readFileSync, writeFileSync } from 'fs';

const path = 'src/pages/site-report/index.astro';
let t = readFileSync(path, 'utf8');

const promoTbody = `<tbody>
          <tr style="border-bottom:1px solid #f4f1eb;"><td style="padding:8px 12px;font-weight:800;color:#059669;">DONE</td><td style="padding:8px 12px;">25 Jun: Site-report v4.0 — full growth dashboard + GSC/GA4/Bing MCP refresh.</td><td style="padding:8px 12px;">Single analytics dashboard for mexico-invest.com launch phase.</td></tr>
          <tr style="border-bottom:1px solid #f4f1eb;"><td style="padding:8px 12px;font-weight:800;color:#dc2626;">P0</td><td style="padding:8px 12px;">CTR sprint: can-foreigners-buy-property-mexico (8 imp, pos 4.2, 0 clk).</td><td style="padding:8px 12px;">Convert top-5 positions into first commercial clicks.</td></tr>
          <tr style="border-bottom:1px solid #f4f1eb;"><td style="padding:8px 12px;font-weight:800;color:#ea580c;">P1</td><td style="padding:8px 12px;">News cadence — scale from 7 to 3 articles/week.</td><td style="padding:8px 12px;">NewsArticle freshness signal for Google + Bing.</td></tr>
          <tr style="border-bottom:1px solid #f4f1eb;"><td style="padding:8px 12px;font-weight:800;color:#ea580c;">P1</td><td style="padding:8px 12px;">GA4 lead event verification on LeadForm.</td><td style="padding:8px 12px;">Fix 0 key events · measure conversion from organic.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:800;color:#2563eb;">P2</td><td style="padding:8px 12px;">Re-report GSC 2 Jul · monitor click URL growth.</td><td style="padding:8px 12px;">Baseline 94 imp · target 500+ imp in 4 weeks.</td></tr>
        </tbody>`;

t = t.replace(/<tbody>\s*<tr style="border-bottom:1px solid #f4f1eb;"><td style="padding:8px 12px;font-weight:800;color:#059669;">DONE<\/td><td style="padding:8px 12px;">19 Jun: 4 Collaborator[\s\S]*?<\/tbody>/, promoTbody);

const bingBlock = `  <!-- BING PULSE — Bing Webmaster Tools -->
  <div class="section-title" style="margin-top:40px;">Bing Pulse — Bing Webmaster Tools</div>

  <div style="background:white;border-radius:16px;border:1px solid #e8e4dc;padding:24px 28px;">
    <div class="pulse-header">
      <div>
        <h2>Bing / Yahoo Search Performance</h2>
        <p style="font-size:12px;color:#9ca3af;margin-top:2px;">mexico-invest.com · Jun 2026 · MCP bing-webmaster-mexico-invest · Updated 25 Jun</p>
      </div>
      <div class="pulse-updated"><span class="pulse-updated-dot"></span>Live via MCP</div>
    </div>
    <div class="pulse-kpi-row">
      <div class="pulse-kpi kpi-orange">
        <div class="kpi-trend trend-new">Early</div>
        <div class="kpi-label">Bing Clicks</div>
        <div class="kpi-val">0</div>
        <div class="kpi-sub">Site 20 days old · indexing just started</div>
      </div>
      <div class="pulse-kpi kpi-blue">
        <div class="kpi-label">Bing Impressions</div>
        <div class="kpi-val">3</div>
        <div class="kpi-sub">First signals 20–22 Jun · weekly API buckets</div>
      </div>
      <div class="pulse-kpi kpi-green">
        <div class="kpi-label">Sitemap</div>
        <div class="kpi-val">309</div>
        <div class="kpi-sub">Submitted · Bing Webmaster connected</div>
      </div>
      <div class="pulse-kpi kpi-purple">
        <div class="kpi-label">Google vs Bing</div>
        <div class="kpi-val">94:3</div>
        <div class="kpi-sub">GSC imp : Bing imp · Google leads as expected</div>
      </div>
    </div>
    <div class="pulse-insight">
      <div class="pulse-insight-icon">🔶</div>
      <div class="pulse-insight-text"><strong>Bing baseline:</strong> 3 impressions in first Bing weekly buckets. Normal for a 20-day-old domain. Re-check in 2–3 weeks after full index propagation.</div>
    </div>
    <p class="pulse-footer-note">Bing data via bing-webmaster-mexico-invest MCP</p>
  </div>`;

t = t.replace(/  <!-- BING PULSE — Bing Webmaster Tools -->[\s\S]*?  <div class="section-title">Technical setup<\/div>/, bingBlock + '\n\n  <div class="section-title">Technical setup</div>');

const contentTable = `      <tbody>
        <tr>
          <td><strong>Guides</strong><br><span style="font-size:11px;color:#9ca3af">Foreign ownership, fideicomiso, AMPI, tax/CFDI, STR, insurance, buyer nationality, investment strategy</span></td>
          <td><span class="count">116</span></td>
          <td><span class="words">~2 841 words</span></td>
          <td><span class="tag blue">Head keywords</span></td>
          <td><span class="tag green">Live</span></td>
        </tr>
        <tr>
          <td><strong>Area guides — 32 Mexico markets</strong><br><span style="font-size:11px;color:#9ca3af">Playa del Carmen, Tulum, Cancún, Los Cabos, Puerto Vallarta, Mérida, CDMX zones and more</span></td>
          <td><span class="count">32</span></td>
          <td><span class="words">~2 496 words</span></td>
          <td><span class="tag blue">Location intent</span></td>
          <td><span class="tag green">Live</span></td>
        </tr>
        <tr>
          <td><strong>Project reviews</strong><br><span style="font-size:11px;color:#9ca3af">100 developments · Cloudinary photos ×3 each</span></td>
          <td><span class="count">100</span></td>
          <td><span class="words">~1 579 words</span></td>
          <td><span class="tag blue">Project intent</span></td>
          <td><span class="tag green">Live</span></td>
        </tr>
        <tr>
          <td><strong>Comparisons</strong><br><span style="font-size:11px;color:#9ca3af">Mexico vs USA/Spain/Portugal, Playa vs Tulum, fideicomiso vs direct</span></td>
          <td><span class="count">34</span></td>
          <td><span class="words">~2 354 words</span></td>
          <td><span class="tag amber">Comparison intent</span></td>
          <td><span class="tag green">Live</span></td>
        </tr>
        <tr>
          <td><strong>Developer profiles</strong><br><span style="font-size:11px;color:#9ca3af">9 major developers — AMPI-verified brokers, track record</span></td>
          <td><span class="count">9</span></td>
          <td><span class="words">~2 061 words</span></td>
          <td><span class="tag blue">Developer intent</span></td>
          <td><span class="tag green">Live</span></td>
        </tr>
        <tr>
          <td><strong>News</strong><br><span style="font-size:11px;color:#9ca3af">Banxico FX, Playa resale, Los Cabos luxury · target 3/week</span></td>
          <td><span class="count">7</span></td>
          <td><span class="words">~793 words</span></td>
          <td><span class="tag gray">NewsArticle Schema</span></td>
          <td><span class="tag amber">Scale up</span></td>
        </tr>
        <tr style="background:#fffbeb;">
          <td><strong>TOTAL</strong></td>
          <td><span class="count" style="font-size:24px;">298</span></td>
          <td><span class="words">~2 253 avg</span></td>
          <td></td>
          <td><span class="tag green">qa:corpus PASS</span></td>
        </tr>
      </tbody>`;

t = t.replace(/      <tbody>[\s\S]*?      <\/tbody>\n    <\/table>\n  <\/div>\n\n  <div class="section-title">Change history<\/div>/, contentTable + '\n    </table>\n  </div>\n\n  <div class="section-title">Change history</div>');

const changelog = `  <div class="changelog">
      <div class="changelog-item">
        <div class="changelog-date">25 Jun 2026</div>
        <div class="changelog-content">
          <div class="changelog-title">Site report v4.0 — full MORE Group dashboard format + GSC/GA4/Bing refresh</div>
          <div class="changelog-desc">Growth dashboard with Chart.js: monthly GSC/GA4, daily momentum, content donut, MoM table. GSC 1 Jun–22 Jun: 1 click, 94 impressions, 15 pages in SERP. First click 22 Jun on cfdi-cost-basis-mexico (33% CTR). GA4: 78 sessions, 1 organic. Bing: 3 impressions. Indexing: 309 URLs submitted, backlog 0.</div>
          <div class="changelog-tags"><span class="tag green">v4.0</span><span class="tag blue">GSC MCP</span><span class="tag amber">Charts</span></div>
        </div>
      </div>
      <div class="changelog-item">
        <div class="changelog-date">16 Jun 2026</div>
        <div class="changelog-content">
          <div class="changelog-title">Phase B+C fix pack + 3 news + CTR sprint + indexing batch</div>
          <div class="changelog-desc">41 articles: Cloudinary images (111 photos), Quick answer stubs, em-dash humanize, strict gate. News: Banxico FX, Playa resale, Los Cabos luxury. CTR rewrite: can-foreigners-buy + airbnb guide titles. Google Indexing API 309 URLs. Build PASS.</div>
          <div class="changelog-tags"><span class="tag green">Phase B+C</span><span class="tag blue">Indexing</span><span class="tag amber">CTR</span></div>
        </div>
      </div>
      <div class="changelog-item">
        <div class="changelog-date">5–10 Jun 2026</div>
        <div class="changelog-content">
          <div class="changelog-title">Site launched — 298 MDX articles, mexico-invest-indexing GCP project</div>
          <div class="changelog-desc">mexico-invest.com live on Vercel. 116 guides, 100 projects, 32 areas, 34 comparisons, 9 developers. Dedicated GCP project for Google Indexing API. SA ownership via Site Verification API.</div>
          <div class="changelog-tags"><span class="tag green">Launch</span><span class="tag blue">298 pages</span><span class="tag amber">GCP setup</span></div>
        </div>
      </div>
  </div>`;

t = t.replace(/  <div class="changelog">[\s\S]*?  <\/div>\n\n      <div class="section-title">Next steps/, changelog + '\n\n      <div class="section-title">Next steps');

const nextSteps = `      <div class="section-title">Next steps — 25 Jun 2026</div>
  <div class="next-steps">
    <div class="next-item" style="background:#fef2f2;border-color:#fecaca;">
      <div class="priority high">P0</div>
      <div>
        <div class="text" style="font-weight:700;">CTR sprint — can-foreigners-buy (8 imp, pos 4.2, 0 clk)</div>
        <div class="subtext">Title + description live since 16 Jun · monitor GSC weekly.</div>
      </div>
    </div>
    <div class="next-item" style="background:#fff7ed;border-color:#fed7aa;">
      <div class="priority medium">P1</div>
      <div>
        <div class="text" style="font-weight:700;">News cadence — scale from 7 to 3/week</div>
        <div class="subtext">Banxico, Playa resale, Los Cabos batch live · add 2 more this week.</div>
      </div>
    </div>
    <div class="next-item" style="background:#fff7ed;border-color:#fed7aa;">
      <div class="priority medium">P1</div>
      <div>
        <div class="text" style="font-weight:700;">GA4 lead event verification</div>
        <div class="subtext">0 key events reported · verify LeadForm → GA4 conversion tracking.</div>
      </div>
    </div>
    <div class="next-item">
      <div class="priority medium">P1</div>
      <div>
        <div class="text" style="font-weight:700;">Monitor GSC click growth — re-report 2 Jul</div>
        <div class="subtext">94 imp baseline · expect 10× in 4 weeks if index holds pace.</div>
      </div>
    </div>
    <div class="next-item" style="background:#f0fdf4;border-color:#bbf7d0;">
      <div class="priority low">DONE</div>
      <div>
        <div class="text" style="font-weight:700;">Site-report v4.0 + full indexing (309 URLs)</div>
        <div class="subtext">Growth dashboard · GSC/GA4/Bing MCP refresh · Phase B+C fix pack deployed.</div>
      </div>
    </div>
  </div>`;

t = t.replace(/      <div class="section-title">Next steps[\s\S]*?  <div class="section-title">Quick links<\/div>/, nextSteps + '\n\n  <div class="section-title">Quick links</div>');

t = t.replace(/Google Analytics 4 \(GA4\), Yandex Metrika, Pinterest Tag \+ Lead event/g, 'Google Analytics 4 (GA4), Bing Webmaster MCP');
t = t.replace(/USD \/ THB \/ EUR \/ GBP/g, 'USD / MXN / EUR');

writeFileSync(path, t);
console.log('patched', path, 'bytes', t.length);
