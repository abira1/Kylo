export const manifest = {
  screens: {
    scr_maioqa: { name: "Landing", route: "/", position: { "x": 160, "y": 220 } },
    scr_ipbgph: { name: "Login", route: "/login", position: { "x": 1560, "y": 220 } },
    scr_yz27bk: { name: "Register", route: "/register", position: { "x": 2960, "y": 220 } },
    scr_rorpal: { name: "Admin Login", route: "/admin", position: { "x": 160, "y": 4180 } },
    scr_hewpj5: { name: "Dashboard Home", route: "/dashboard", position: { "x": 160, "y": 2200 } },
    scr_jy5hs7: { name: "Embed & Setup", route: "/dashboard/embed", position: { "x": 1560, "y": 2200 } },
    scr_jiuvp6: { name: "Lead Inbox", route: "/dashboard/leads", position: { "x": 2960, "y": 2200 } },
    scr_aku3uu: { name: "Conversations", route: "/dashboard/conversations", position: { "x": 4360, "y": 2200 } },
    scr_lxzz6y: { name: "WhatsApp", route: "/dashboard/whatsapp", position: { "x": 5760, "y": 2200 } },
    scr_k015zz: { name: "Q&A Training", route: "/dashboard/training", position: { "x": 7160, "y": 2200 } },
    scr_rn8dgo: { name: "Analytics", route: "/dashboard/analytics", position: { "x": 8560, "y": 2200 } },
    scr_pcydtp: { name: "Payments", route: "/dashboard/payments", position: { "x": 9960, "y": 2200 } },
    scr_n9ez35: { name: "Settings", route: "/dashboard/settings", position: { "x": 11360, "y": 2200 } },
    scr_2iu9ns: { name: "Admin Overview", route: "/admin/dashboard", position: { "x": 160, "y": 6160 } },
    scr_ltf9pf: { name: "Admin Clients", route: "/admin/dashboard/clients", position: { "x": 1560, "y": 6160 } },
    scr_g8o7ed: { name: "Admin Knowledge", route: "/admin/dashboard/knowledge", position: { "x": 2960, "y": 6160 } },
    scr_qyirq8: { name: "Admin Packages", route: "/admin/dashboard/packages", position: { "x": 4360, "y": 6160 } },
    scr_l04qsn: { name: "Admin Analytics", route: "/admin/dashboard/analytics", position: { "x": 5760, "y": 6160 } },
    scr_bgw3yp: { name: "Admin Settings", route: "/admin/dashboard/settings", position: { "x": 7160, "y": 6160 } }
  },
  sections: {
    sec_a3eamc: { name: "Authentication & Onboarding", x: 0, y: 0, width: 4320, height: 1180 },
    sec_cd6r45: { name: "Dashboard", x: 0, y: 1980, width: 12720, height: 1180 },
    sec_vn329l: { name: "Admin Authentication", x: 0, y: 3960, width: 1520, height: 1180 },
    sec_taw1m8: { name: "Admin Dashboard", x: 0, y: 5940, width: 8520, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_a3eamc", children: [
    { kind: "screen", id: "scr_maioqa" },
    { kind: "screen", id: "scr_ipbgph" },
    { kind: "screen", id: "scr_yz27bk" }]
  },
  { kind: "section", id: "sec_cd6r45", children: [
    { kind: "screen", id: "scr_hewpj5" },
    { kind: "screen", id: "scr_jy5hs7" },
    { kind: "screen", id: "scr_jiuvp6" },
    { kind: "screen", id: "scr_aku3uu" },
    { kind: "screen", id: "scr_lxzz6y" },
    { kind: "screen", id: "scr_k015zz" },
    { kind: "screen", id: "scr_rn8dgo" },
    { kind: "screen", id: "scr_pcydtp" },
    { kind: "screen", id: "scr_n9ez35" }]
  },
  { kind: "section", id: "sec_vn329l", children: [
    { kind: "screen", id: "scr_rorpal" }]
  },
  { kind: "section", id: "sec_taw1m8", children: [
    { kind: "screen", id: "scr_2iu9ns" },
    { kind: "screen", id: "scr_ltf9pf" },
    { kind: "screen", id: "scr_g8o7ed" },
    { kind: "screen", id: "scr_qyirq8" },
    { kind: "screen", id: "scr_l04qsn" },
    { kind: "screen", id: "scr_bgw3yp" }]
  }]

};