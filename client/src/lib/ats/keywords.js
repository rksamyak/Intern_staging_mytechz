/**
 * Job Role Keyword Dictionary
 * Each entry: [roleName, roleSlug, roleCategory, keyword, keywordType, importance, weight]
 * importance: 'required' | 'preferred' | 'bonus'
 * keywordType: 'hard_skill' | 'soft_skill' | 'tool' | 'action_verb' | 'industry_term' | 'certification'
 */
export const JOB_ROLE_KEYWORDS = [
  // ── Software Engineer ────────────────────────────────────────────────────
  ['Software Engineer','software-engineer','tech','Python',           'hard_skill',    'required', 2.0],
  ['Software Engineer','software-engineer','tech','Java',             'hard_skill',    'required', 2.0],
  ['Software Engineer','software-engineer','tech','JavaScript',       'hard_skill',    'required', 2.0],
  ['Software Engineer','software-engineer','tech','REST API',         'hard_skill',    'required', 1.8],
  ['Software Engineer','software-engineer','tech','SQL',              'hard_skill',    'required', 1.8],
  ['Software Engineer','software-engineer','tech','Git',              'tool',          'required', 1.5],
  ['Software Engineer','software-engineer','tech','Agile',            'industry_term', 'required', 1.5],
  ['Software Engineer','software-engineer','tech','unit testing',     'hard_skill',    'required', 1.4],
  ['Software Engineer','software-engineer','tech','data structures',  'hard_skill',    'required', 1.8],
  ['Software Engineer','software-engineer','tech','algorithms',       'hard_skill',    'required', 1.8],
  ['Software Engineer','software-engineer','tech','Docker',           'tool',          'preferred',1.3],
  ['Software Engineer','software-engineer','tech','Kubernetes',       'tool',          'preferred',1.2],
  ['Software Engineer','software-engineer','tech','CI/CD',            'industry_term', 'preferred',1.2],
  ['Software Engineer','software-engineer','tech','microservices',    'industry_term', 'preferred',1.1],
  ['Software Engineer','software-engineer','tech','TypeScript',       'hard_skill',    'preferred',1.1],
  ['Software Engineer','software-engineer','tech','React',            'tool',          'preferred',1.0],
  ['Software Engineer','software-engineer','tech','Node.js',          'tool',          'preferred',1.0],
  ['Software Engineer','software-engineer','tech','AWS',              'tool',          'bonus',    0.9],
  ['Software Engineer','software-engineer','tech','system design',    'hard_skill',    'preferred',1.0],
  ['Software Engineer','software-engineer','tech','cloud',            'industry_term', 'preferred',1.0],

  // ── Full Stack Developer ─────────────────────────────────────────────────
  ['Full Stack Developer','full-stack-developer','tech','React',      'tool',       'required', 2.0],
  ['Full Stack Developer','full-stack-developer','tech','Node.js',    'tool',       'required', 2.0],
  ['Full Stack Developer','full-stack-developer','tech','JavaScript', 'hard_skill', 'required', 2.0],
  ['Full Stack Developer','full-stack-developer','tech','HTML',       'hard_skill', 'required', 1.8],
  ['Full Stack Developer','full-stack-developer','tech','CSS',        'hard_skill', 'required', 1.8],
  ['Full Stack Developer','full-stack-developer','tech','REST API',   'hard_skill', 'required', 1.8],
  ['Full Stack Developer','full-stack-developer','tech','MongoDB',    'tool',       'required', 1.5],
  ['Full Stack Developer','full-stack-developer','tech','SQL',        'hard_skill', 'required', 1.5],
  ['Full Stack Developer','full-stack-developer','tech','Git',        'tool',       'required', 1.5],
  ['Full Stack Developer','full-stack-developer','tech','Docker',     'tool',       'preferred',1.2],
  ['Full Stack Developer','full-stack-developer','tech','TypeScript', 'hard_skill', 'preferred',1.2],
  ['Full Stack Developer','full-stack-developer','tech','Next.js',    'tool',       'preferred',1.0],
  ['Full Stack Developer','full-stack-developer','tech','Redux',      'tool',       'preferred',0.9],

  // ── Data Analyst ─────────────────────────────────────────────────────────
  ['Data Analyst','data-analyst','data','Python',              'hard_skill',    'required', 2.0],
  ['Data Analyst','data-analyst','data','SQL',                 'hard_skill',    'required', 2.0],
  ['Data Analyst','data-analyst','data','Excel',               'tool',          'required', 1.8],
  ['Data Analyst','data-analyst','data','data visualization',  'hard_skill',    'required', 1.8],
  ['Data Analyst','data-analyst','data','Tableau',             'tool',          'required', 1.7],
  ['Data Analyst','data-analyst','data','Power BI',            'tool',          'preferred',1.5],
  ['Data Analyst','data-analyst','data','statistics',          'hard_skill',    'required', 1.5],
  ['Data Analyst','data-analyst','data','pandas',              'tool',          'required', 1.5],
  ['Data Analyst','data-analyst','data','numpy',               'tool',          'preferred',1.2],
  ['Data Analyst','data-analyst','data','data cleaning',       'hard_skill',    'required', 1.4],
  ['Data Analyst','data-analyst','data','dashboards',          'industry_term', 'required', 1.3],
  ['Data Analyst','data-analyst','data','KPI',                 'industry_term', 'required', 1.3],
  ['Data Analyst','data-analyst','data','A/B testing',         'hard_skill',    'preferred',1.1],
  ['Data Analyst','data-analyst','data','Google Analytics',    'tool',          'preferred',1.0],

  // ── ML Engineer ──────────────────────────────────────────────────────────
  ['ML Engineer','ml-engineer','data','Python',            'hard_skill', 'required', 2.0],
  ['ML Engineer','ml-engineer','data','machine learning',  'hard_skill', 'required', 2.0],
  ['ML Engineer','ml-engineer','data','TensorFlow',        'tool',       'required', 1.8],
  ['ML Engineer','ml-engineer','data','PyTorch',           'tool',       'required', 1.8],
  ['ML Engineer','ml-engineer','data','scikit-learn',      'tool',       'required', 1.7],
  ['ML Engineer','ml-engineer','data','deep learning',     'hard_skill', 'required', 1.7],
  ['ML Engineer','ml-engineer','data','NLP',               'hard_skill', 'preferred',1.5],
  ['ML Engineer','ml-engineer','data','computer vision',   'hard_skill', 'preferred',1.4],
  ['ML Engineer','ml-engineer','data','SQL',               'hard_skill', 'required', 1.5],
  ['ML Engineer','ml-engineer','data','feature engineering','hard_skill','required', 1.5],
  ['ML Engineer','ml-engineer','data','model deployment',  'hard_skill', 'preferred',1.3],
  ['ML Engineer','ml-engineer','data','MLOps',             'industry_term','preferred',1.2],

  // ── DevOps Engineer ──────────────────────────────────────────────────────
  ['DevOps Engineer','devops-engineer','tech','Docker',         'tool',          'required', 2.0],
  ['DevOps Engineer','devops-engineer','tech','Kubernetes',     'tool',          'required', 2.0],
  ['DevOps Engineer','devops-engineer','tech','CI/CD',          'industry_term', 'required', 2.0],
  ['DevOps Engineer','devops-engineer','tech','Jenkins',        'tool',          'required', 1.8],
  ['DevOps Engineer','devops-engineer','tech','AWS',            'tool',          'required', 1.8],
  ['DevOps Engineer','devops-engineer','tech','Terraform',      'tool',          'required', 1.7],
  ['DevOps Engineer','devops-engineer','tech','Linux',          'hard_skill',    'required', 1.7],
  ['DevOps Engineer','devops-engineer','tech','Ansible',        'tool',          'preferred',1.4],
  ['DevOps Engineer','devops-engineer','tech','monitoring',     'hard_skill',    'required', 1.5],
  ['DevOps Engineer','devops-engineer','tech','Prometheus',     'tool',          'preferred',1.3],
  ['DevOps Engineer','devops-engineer','tech','Grafana',        'tool',          'preferred',1.2],
  ['DevOps Engineer','devops-engineer','tech','shell scripting','hard_skill',    'required', 1.5],
  ['DevOps Engineer','devops-engineer','tech','Git',            'tool',          'required', 1.5],

  // ── Product Manager ──────────────────────────────────────────────────────
  ['Product Manager','product-manager','product','product roadmap',      'hard_skill',    'required', 2.0],
  ['Product Manager','product-manager','product','user stories',         'hard_skill',    'required', 2.0],
  ['Product Manager','product-manager','product','Agile',                'industry_term', 'required', 2.0],
  ['Product Manager','product-manager','product','Scrum',                'industry_term', 'required', 1.8],
  ['Product Manager','product-manager','product','stakeholder management','soft_skill',   'required', 1.8],
  ['Product Manager','product-manager','product','PRD',                  'industry_term', 'required', 1.7],
  ['Product Manager','product-manager','product','go-to-market',         'industry_term', 'required', 1.5],
  ['Product Manager','product-manager','product','A/B testing',          'hard_skill',    'preferred',1.4],
  ['Product Manager','product-manager','product','JIRA',                 'tool',          'preferred',1.3],
  ['Product Manager','product-manager','product','KPI',                  'industry_term', 'required', 1.5],
  ['Product Manager','product-manager','product','user research',        'hard_skill',    'required', 1.5],
  ['Product Manager','product-manager','product','wireframes',           'hard_skill',    'preferred',1.2],
  ['Product Manager','product-manager','product','metrics',              'hard_skill',    'required', 1.5],
  ['Product Manager','product-manager','product','prioritization',       'soft_skill',    'required', 1.5],

  // ── UI/UX Designer ───────────────────────────────────────────────────────
  ['UI/UX Designer','ui-ux-designer','design','Figma',                   'tool',       'required', 2.0],
  ['UI/UX Designer','ui-ux-designer','design','user research',           'hard_skill', 'required', 2.0],
  ['UI/UX Designer','ui-ux-designer','design','wireframing',             'hard_skill', 'required', 2.0],
  ['UI/UX Designer','ui-ux-designer','design','prototyping',             'hard_skill', 'required', 1.8],
  ['UI/UX Designer','ui-ux-designer','design','usability testing',       'hard_skill', 'required', 1.8],
  ['UI/UX Designer','ui-ux-designer','design','design systems',          'hard_skill', 'preferred',1.5],
  ['UI/UX Designer','ui-ux-designer','design','Adobe XD',                'tool',       'preferred',1.3],
  ['UI/UX Designer','ui-ux-designer','design','accessibility',           'hard_skill', 'preferred',1.2],
  ['UI/UX Designer','ui-ux-designer','design','interaction design',      'hard_skill', 'required', 1.5],
  ['UI/UX Designer','ui-ux-designer','design','information architecture','hard_skill', 'preferred',1.2],

  // ── Business Analyst ─────────────────────────────────────────────────────
  ['Business Analyst','business-analyst','product','requirements gathering','hard_skill',    'required', 2.0],
  ['Business Analyst','business-analyst','product','BRD',                   'industry_term', 'required', 1.8],
  ['Business Analyst','business-analyst','product','process mapping',       'hard_skill',    'required', 1.8],
  ['Business Analyst','business-analyst','product','SQL',                   'hard_skill',    'preferred',1.5],
  ['Business Analyst','business-analyst','product','Excel',                 'tool',          'required', 1.5],
  ['Business Analyst','business-analyst','product','stakeholder management','soft_skill',    'required', 1.8],
  ['Business Analyst','business-analyst','product','gap analysis',          'hard_skill',    'required', 1.5],
  ['Business Analyst','business-analyst','product','UAT',                   'industry_term', 'required', 1.5],
  ['Business Analyst','business-analyst','product','JIRA',                  'tool',          'preferred',1.2],
  ['Business Analyst','business-analyst','product','Agile',                 'industry_term', 'preferred',1.3],

  // ── Digital Marketer ─────────────────────────────────────────────────────
  ['Digital Marketer','digital-marketer','marketing','SEO',                'hard_skill', 'required', 2.0],
  ['Digital Marketer','digital-marketer','marketing','SEM',                'hard_skill', 'required', 2.0],
  ['Digital Marketer','digital-marketer','marketing','Google Analytics',   'tool',       'required', 1.8],
  ['Digital Marketer','digital-marketer','marketing','social media marketing','hard_skill','required',1.8],
  ['Digital Marketer','digital-marketer','marketing','content marketing',  'hard_skill', 'required', 1.7],
  ['Digital Marketer','digital-marketer','marketing','email marketing',    'hard_skill', 'required', 1.5],
  ['Digital Marketer','digital-marketer','marketing','PPC',                'hard_skill', 'preferred',1.4],
  ['Digital Marketer','digital-marketer','marketing','Google Ads',         'tool',       'preferred',1.3],
  ['Digital Marketer','digital-marketer','marketing','Meta Ads',           'tool',       'preferred',1.2],
  ['Digital Marketer','digital-marketer','marketing','copywriting',        'hard_skill', 'preferred',1.2],
  ['Digital Marketer','digital-marketer','marketing','A/B testing',        'hard_skill', 'preferred',1.1],

  // ── HR Manager ───────────────────────────────────────────────────────────
  ['HR Manager','hr-manager','hr','recruitment',             'hard_skill',    'required', 2.0],
  ['HR Manager','hr-manager','hr','talent acquisition',      'hard_skill',    'required', 2.0],
  ['HR Manager','hr-manager','hr','onboarding',              'hard_skill',    'required', 1.8],
  ['HR Manager','hr-manager','hr','performance management',  'hard_skill',    'required', 1.8],
  ['HR Manager','hr-manager','hr','employee relations',      'hard_skill',    'required', 1.7],
  ['HR Manager','hr-manager','hr','HRIS',                    'tool',          'preferred',1.4],
  ['HR Manager','hr-manager','hr','compensation and benefits','hard_skill',   'preferred',1.3],
  ['HR Manager','hr-manager','hr','labour law',              'industry_term', 'preferred',1.3],
  ['HR Manager','hr-manager','hr','HR policies',             'industry_term', 'required', 1.5],
  ['HR Manager','hr-manager','hr','payroll',                 'hard_skill',    'preferred',1.2],

  // ── Finance Analyst ──────────────────────────────────────────────────────
  ['Finance Analyst','finance-analyst','finance','financial modeling', 'hard_skill', 'required', 2.0],
  ['Finance Analyst','finance-analyst','finance','Excel',              'tool',       'required', 2.0],
  ['Finance Analyst','finance-analyst','finance','valuation',          'hard_skill', 'required', 1.8],
  ['Finance Analyst','finance-analyst','finance','DCF',                'hard_skill', 'required', 1.8],
  ['Finance Analyst','finance-analyst','finance','financial statements','hard_skill','required', 1.7],
  ['Finance Analyst','finance-analyst','finance','budgeting',          'hard_skill', 'required', 1.5],
  ['Finance Analyst','finance-analyst','finance','forecasting',        'hard_skill', 'required', 1.5],
  ['Finance Analyst','finance-analyst','finance','variance analysis',  'hard_skill', 'required', 1.5],
  ['Finance Analyst','finance-analyst','finance','P&L',                'industry_term','required',1.5],
  ['Finance Analyst','finance-analyst','finance','Power BI',           'tool',       'preferred',1.2],
  ['Finance Analyst','finance-analyst','finance','SQL',                'hard_skill', 'preferred',1.2],

  // ── QA Engineer ──────────────────────────────────────────────────────────
  ['QA Engineer','qa-engineer','tech','test automation',   'hard_skill',    'required', 2.0],
  ['QA Engineer','qa-engineer','tech','Selenium',          'tool',          'required', 1.8],
  ['QA Engineer','qa-engineer','tech','manual testing',    'hard_skill',    'required', 1.8],
  ['QA Engineer','qa-engineer','tech','test cases',        'hard_skill',    'required', 1.8],
  ['QA Engineer','qa-engineer','tech','bug tracking',      'hard_skill',    'required', 1.5],
  ['QA Engineer','qa-engineer','tech','JIRA',              'tool',          'required', 1.5],
  ['QA Engineer','qa-engineer','tech','API testing',       'hard_skill',    'preferred',1.4],
  ['QA Engineer','qa-engineer','tech','Postman',           'tool',          'preferred',1.2],
  ['QA Engineer','qa-engineer','tech','regression testing','hard_skill',    'required', 1.5],
  ['QA Engineer','qa-engineer','tech','Agile',             'industry_term', 'required', 1.5],

  // ── Cybersecurity Analyst ────────────────────────────────────────────────
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','penetration testing',   'hard_skill',    'required', 2.0],
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','SIEM',                  'tool',          'required', 1.8],
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','vulnerability assessment','hard_skill',   'required', 1.8],
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','incident response',      'hard_skill',    'required', 1.8],
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','network security',       'hard_skill',    'required', 1.7],
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','firewall',               'hard_skill',    'required', 1.5],
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','CISSP',                  'certification', 'preferred',1.5],
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','SOC',                    'industry_term', 'required', 1.5],
  ['Cybersecurity Analyst','cybersecurity-analyst','tech','Python',                 'hard_skill',    'preferred',1.3],

  // ── Cloud Architect ──────────────────────────────────────────────────────
  ['Cloud Architect','cloud-architect','tech','AWS',             'tool',          'required', 2.0],
  ['Cloud Architect','cloud-architect','tech','Terraform',       'tool',          'required', 1.8],
  ['Cloud Architect','cloud-architect','tech','Kubernetes',      'tool',          'required', 1.8],
  ['Cloud Architect','cloud-architect','tech','cloud migration', 'hard_skill',    'required', 1.7],
  ['Cloud Architect','cloud-architect','tech','VPC',             'hard_skill',    'required', 1.5],
  ['Cloud Architect','cloud-architect','tech','IAM',             'hard_skill',    'required', 1.5],
  ['Cloud Architect','cloud-architect','tech','cost optimization','hard_skill',   'required', 1.5],
  ['Cloud Architect','cloud-architect','tech','serverless',      'hard_skill',    'preferred',1.3],
  ['Cloud Architect','cloud-architect','tech','Azure',           'tool',          'preferred',1.5],
  ['Cloud Architect','cloud-architect','tech','GCP',             'tool',          'preferred',1.5],

  // ── General fallback (no role selected) ─────────────────────────────────
  ['General','general','general','communication',      'soft_skill', 'required', 1.5],
  ['General','general','general','teamwork',           'soft_skill', 'required', 1.5],
  ['General','general','general','problem solving',    'soft_skill', 'required', 1.5],
  ['General','general','general','leadership',         'soft_skill', 'preferred',1.3],
  ['General','general','general','time management',    'soft_skill', 'required', 1.3],
  ['General','general','general','Microsoft Office',   'tool',       'required', 1.2],
  ['General','general','general','project management', 'hard_skill', 'preferred',1.2],
  ['General','general','general','analytical skills',  'soft_skill', 'preferred',1.2],
  ['General','general','general','attention to detail','soft_skill', 'required', 1.2],
  ['General','general','general','adaptability',       'soft_skill', 'preferred',1.0],
]

/** Deduplicated list of available roles for the dropdown */
export const JOB_ROLES = [
  ...new Map(
    JOB_ROLE_KEYWORDS.map(([roleName, roleSlug, roleCategory]) => [
      roleSlug,
      { role_name: roleName, role_slug: roleSlug, role_category: roleCategory },
    ])
  ).values(),
].filter(r => r.role_slug !== 'general')

/** Get keyword rows for one or more role slugs */
export function getKeywordsForRoles(roleSlugs) {
  if (!roleSlugs || roleSlugs.length === 0) {
    return JOB_ROLE_KEYWORDS.filter(r => r[1] === 'general').map(toKwObj)
  }
  return JOB_ROLE_KEYWORDS
    .filter(r => roleSlugs.includes(r[1]))
    .map(toKwObj)
}

function toKwObj([roleName, roleSlug, , keyword, keywordType, importance, weight]) {
  return { roleName, roleSlug, keyword, keywordType, importance, weight }
}
