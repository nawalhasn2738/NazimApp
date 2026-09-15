import zipfile
from pathlib import Path
from datetime import date
from xml.sax.saxutils import escape

OUT = Path('NazimApp_Progress_Report.docx')

NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def t(text):
    return escape(str(text))


def run(text, bold=False, italic=False, color=None, size=None):
    props = []
    if bold:
        props.append('<w:b/>')
    if italic:
        props.append('<w:i/>')
    if color:
        props.append(f'<w:color w:val="{color}"/>')
    if size:
        props.append(f'<w:sz w:val="{int(size * 2)}"/>')
    rpr = f'<w:rPr>{"".join(props)}</w:rPr>' if props else ''
    preserve = ' xml:space="preserve"' if str(text).startswith(' ') or str(text).endswith(' ') else ''
    return f'<w:r>{rpr}<w:t{preserve}>{t(text)}</w:t></w:r>'


def para(text='', style='Normal', runs=None):
    content = ''.join(runs) if runs is not None else run(text)
    return f'<w:p><w:pPr><w:pStyle w:val="{style}"/></w:pPr>{content}</w:p>'


def table(rows, widths, header=True):
    total = sum(widths)
    xml = [
        '<w:tbl>',
        '<w:tblPr>',
        '<w:tblStyle w:val="ReportTable"/>',
        f'<w:tblW w:w="{total}" w:type="dxa"/>',
        '<w:tblInd w:w="120" w:type="dxa"/>',
        '<w:tblLayout w:type="fixed"/>',
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/></w:tblBorders>',
        '<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>',
        '</w:tblPr>',
        '<w:tblGrid>' + ''.join(f'<w:gridCol w:w="{w}"/>' for w in widths) + '</w:tblGrid>'
    ]
    for r_i, row in enumerate(rows):
        xml.append('<w:tr>')
        for c_i, cell in enumerate(row):
            fill = '<w:shd w:val="clear" w:color="auto" w:fill="F2F4F7"/>' if header and r_i == 0 else ''
            style = 'TableHeader' if header and r_i == 0 else 'TableText'
            xml.append(f'<w:tc><w:tcPr><w:tcW w:w="{widths[c_i]}" w:type="dxa"/>{fill}</w:tcPr>{para(cell, style)}</w:tc>')
        xml.append('</w:tr>')
    xml.append('</w:tbl>')
    return ''.join(xml)


def label_para(label, body):
    return para(runs=[run(label, bold=True, color='1F4D78'), run(' ' + body)])


def divider():
    return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="D9E2EC"/></w:pBdr><w:spacing w:before="80" w:after="120"/></w:pPr></w:p>'


body = []
body.append(para('Nazim App Progress Report', 'Title'))
body.append(para('Status update through September 15, 2026', 'Subtitle'))
body.append(para(runs=[run('Project: ', bold=True), run('NazimApp mobile academic dashboard and what-if simulator')], style='Meta'))
body.append(divider())

body.append(para('Executive Summary', 'Heading1'))
body.append(para('Nazim App is currently implemented as an Expo SDK 57 / React Native application using Expo Router. The working app flow is centered on a dashboard view and a what-if simulator view, with shared state managed in src/app/index.tsx. The main runtime blocker from invalid screen component exports has been resolved, and the simulator screen has been restored with the intended attendance and marks simulation controls.'))
body.append(label_para('Current stage:', 'functional prototype with dashboard, simulator, shared course state, reusable UI components, and chart integration.'))
body.append(label_para('Primary remaining work:', 'tighten TypeScript typing, remove stale starter navigation references, clean minor text encoding issues, and perform full device QA in Expo Go.'))

body.append(para('Current Build Snapshot', 'Heading1'))
body.append(table([
    ['Area', 'Status', 'Progress Details'],
    ['App framework', 'In place', 'Expo SDK 57 with React Native 0.86.3, React 19.2.3, and Expo Router entry configured.'],
    ['Navigation model', 'In place', 'src/app/index.tsx holds activeTab state and switches between DashboardView and SimulatorView.'],
    ['Dashboard view', 'Implemented', 'Shows GPA, credits, average attendance, grade bar chart, attendance progress chart, announcements, and simulator navigation.'],
    ['Simulator view', 'Implemented', 'Supports expected marks input validation, attendance what-if actions, course removal, alert badges, and dashboard return.'],
    ['Shared components', 'Implemented', 'Card, CustomButton, and AlertBadge are available as reusable default-exported components.'],
    ['Mock data', 'Implemented', 'Course list, announcements, and attendance threshold are centralized in data/mockData.js.'],
], [1800, 1500, 6060]))

body.append(para('Completed Work', 'Heading1'))
body.append(table([
    ['Milestone', 'What Was Completed'],
    ['Expo app shell', 'Configured src/app/_layout.tsx with a Stack layout and src/app/index.tsx as the app entry screen.'],
    ['Stateful course data', 'Added course state, updateCourse, removeCourse, and activeTab switching in index.tsx.'],
    ['Dashboard restoration', 'Restored DashboardView.js from misplaced screen content and confirmed chart imports are named exports.'],
    ['Chart dependency check', 'Confirmed react-native-chart-kit version 7.0.4 exports BarChart and ProgressChart; react-native-svg is present.'],
    ['Invalid component fix', 'Resolved the runtime error caused by empty screen files being imported as rendered components.'],
    ['Simulator restoration', 'Replaced the placeholder simulator with the full what-if simulator implementation supplied by the project request.'],
    ['Button flow investigation', 'Confirmed CustomButton forwards onPress and that no pointerEvents blocker exists in the relevant files.'],
], [2500, 6860]))

body.append(para('Implemented Feature Detail', 'Heading1'))
body.append(para('DashboardView', 'Heading2'))
body.append(para('DashboardView calculates total credits, approximate GPA, and average attendance from the current course array. It renders summary cards, course-wise grade visualization through BarChart, attendance visualization through ProgressChart, announcements, and the Go to Simulator action.'))
body.append(para('SimulatorView', 'Heading2'))
body.append(para('SimulatorView now imports and uses Card, CustomButton, AlertBadge, and ATTENDANCE_THRESHOLD. It validates marks input from 0 to 100, updates currentGrade through updateCourse, simulates missed and attended classes by changing attendance values, removes courses, and returns to the dashboard through setActiveTab.'))
body.append(para('Reusable UI Components', 'Heading2'))
body.append(para('Card provides a consistent white card surface, CustomButton standardizes primary and secondary button styling while forwarding onPress, and AlertBadge displays safe, warning, and danger states for attendance feedback.'))

body.append(para('Issues Fixed During Development', 'Heading1'))
body.append(table([
    ['Issue', 'Root Cause', 'Resolution'],
    ['Invalid element type runtime error', 'screens/DashboardView.js and screens/SimulatorView.js were empty or placeholder files while index.tsx rendered them as components.', 'Restored valid default function exports in both screen files.'],
    ['Chart import concern', 'Potential mismatch between named imports and react-native-chart-kit exports.', 'Verified installed package exports BarChart and ProgressChart from dist/index.js.'],
    ['Simulator button flow problem', 'SimulatorView placeholder returned minimal content and did not contain the intended simulator flow.', 'Replaced SimulatorView.js with the full simulator implementation.'],
    ['Expo Go confusion', 'Terminal Android launch message was for emulator/USB opening, not QR-code Expo Go loading.', 'Clarified that QR code runs on the phone and Android-on-PC requires an emulator.'],
], [2200, 3300, 3860]))

body.append(para('Verification Performed', 'Heading1'))
body.append(table([
    ['Check', 'Result'],
    ['Expo SDK reference', 'Expo SDK 57 documentation was checked before code edits, matching AGENTS.md instruction.'],
    ['Component export scan', 'Card, CustomButton, AlertBadge, DashboardView, and SimulatorView each expose a default function component.'],
    ['Import path review', 'index.tsx imports DashboardView and SimulatorView as defaults from the expected screens paths.'],
    ['Touch handling review', 'CustomButton passes onPress directly to TouchableOpacity; no relevant pointerEvents blockers were found.'],
    ['TypeScript command', 'npx tsc --noEmit runs but reports existing TypeScript issues outside SimulatorView.js.'],
], [2600, 6760]))

body.append(para('Known Remaining Issues', 'Heading1'))
body.append(table([
    ['Item', 'Impact', 'Recommended Next Action'],
    ['Implicit any parameters in src/app/index.tsx', 'TypeScript strict mode reports id and updatedFields without explicit types.', 'Define a Course type and typed update payload, or convert the app entry to JavaScript if TypeScript strictness is not desired.'],
    ['Stale /explore route reference in src/components/app-tabs.web.tsx', 'TypeScript reports /explore as invalid because src/app/explore.tsx has been deleted.', 'Remove or update the stale tab link if app-tabs.web.tsx remains in the project.'],
    ['AlertBadge text encoding artifacts', 'Labels currently show mojibake characters instead of clean warning/check symbols.', 'Replace symbols with ASCII labels or valid Unicode once UI text cleanup is scheduled.'],
    ['Temporary dashboard console log', 'Go to Simulator currently logs a debug message when pressed.', 'Remove the debug console.log after navigation is confirmed on device.'],
    ['screens/Untitled leftover file', 'Duplicate old DashboardView content remains in an unused file.', 'Delete or archive the unused file after confirming no references depend on it.'],
], [2500, 2600, 4260]))

body.append(para('Recommended Next Milestones', 'Heading1'))
body.append(table([
    ['Priority', 'Milestone', 'Outcome'],
    ['1', 'Resolve TypeScript errors', 'Project check should pass without index.tsx or app-tabs.web.tsx errors.'],
    ['2', 'Device QA in Expo Go', 'Confirm dashboard, simulator navigation, text input, attendance simulation, and course removal on Android.'],
    ['3', 'UI text cleanup', 'Fix encoded AlertBadge labels and remove temporary console logging.'],
    ['4', 'Data persistence planning', 'Decide whether courses should reset on app reload or persist locally.'],
    ['5', 'Course management expansion', 'Add a course creation/editing flow if required by the assignment scope.'],
], [1200, 3000, 5160]))

body.append(para('Project File Map', 'Heading1'))
body.append(table([
    ['File', 'Role'],
    ['src/app/index.tsx', 'Main app state, course update/remove functions, and dashboard/simulator conditional rendering.'],
    ['src/app/_layout.tsx', 'Expo Router stack layout with hidden headers.'],
    ['screens/DashboardView.js', 'Dashboard UI, metrics, charts, announcements, and simulator navigation.'],
    ['screens/SimulatorView.js', 'What-if simulator for marks and attendance scenarios.'],
    ['components/Card.js', 'Reusable card container.'],
    ['components/CustomButton.js', 'Reusable TouchableOpacity-based button.'],
    ['components/AlertBadge.js', 'Reusable attendance status badge.'],
    ['data/mockData.js', 'Initial courses, announcements, and attendance threshold.'],
], [2600, 6760]))

body.append(para('Conclusion', 'Heading1'))
body.append(para('Nazim App has moved from a broken runtime state into a working prototype structure. The core dashboard and simulator flows are now present, component exports/imports are aligned, and the app can be loaded through Expo Go. The next best step is cleanup and stabilization: resolve TypeScript errors, remove stale starter files, fix minor text encoding artifacts, and perform a complete mobile-device test pass.'))

sect = '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{NS_W}" xmlns:r="{NS_R}"><w:body>{''.join(body)}{sect}</w:body></w:document>'''

styles_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{NS_W}">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="000000"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/><w:b/><w:color w:val="0B2545"/><w:sz w:val="56"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="555555"/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:color w:val="555555"/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="1F4D78"/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="19"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/><w:basedOn w:val="TableText"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:b/><w:color w:val="0B2545"/><w:sz w:val="19"/></w:rPr></w:style>
<w:style w:type="table" w:styleId="ReportTable"><w:name w:val="Report Table"/><w:tblPr><w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>'''

content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>'''
rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>'''
settings = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="{NS_W}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/></w:settings>'''

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/_rels/document.xml.rels', doc_rels)
    z.writestr('word/document.xml', document_xml)
    z.writestr('word/styles.xml', styles_xml)
    z.writestr('word/settings.xml', settings)

print(OUT.resolve())