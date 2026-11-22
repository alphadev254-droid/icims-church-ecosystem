export interface FeatureTopic {
  slug: string;
  label: string;
  heading: string;
  description: string;
  intro: string;
  steps: { title: string; body: string }[];
  example: string;
  questions: { question: string; answer: string }[];
  related: string[];
}

export const featureTopics: FeatureTopic[] = [
  {
    slug: 'membership',
    label: 'Church membership management',
    heading: 'Church membership management software',
    description: 'Maintain a church member directory with family relationships, branch assignments, ministry teams and small groups in ICIMS.',
    intro: 'ICIMS gives church administrators a shared member directory. Keep personal records, family relationships and ministry participation connected so staff can find the right information when they need it.',
    steps: [
      { title: 'Build the membership register', body: 'Add members and maintain their contact details and branch assignments. Use the registration request queue to review new member submissions.' },
      { title: 'Link families and ministry groups', body: 'Link children and dependents to a parent or guardian. Organize members into ministry teams, cells or home fellowships so leaders can keep their rosters current.' },
      { title: 'Give staff appropriate access', body: 'Assign roles and permissions so staff can work with records they need for their branch and responsibilities.' },
    ],
    example: 'When a family joins, record the adults in the membership register and link the children to their guardians. Assign the family to the right branch and update group membership as they become involved.',
    questions: [
      { question: 'Can a member register online?', answer: 'ICIMS supports a member registration flow and a queue where authorized staff can review submissions.' },
      { question: 'Can we keep children’s records with the family?', answer: 'Yes. Children and dependents have records that can be linked to a parent or guardian in the church register.' },
    ],
    related: ['children', 'attendance', 'discipleship'],
  },
  {
    slug: 'children',
    label: 'Children and dependents',
    heading: 'Church children and family records',
    description: 'Keep a church children’s register, link each child to parents or guardians and keep pickup and emergency contact details together.',
    intro: 'Children’s ministry teams need to know who a child belongs to and whom to contact. ICIMS keeps a separate children and dependents register with links to the church’s member records.',
    steps: [
      { title: 'Maintain the children’s register', body: 'Record each child under the appropriate church branch and update their details as the family moves or contacts change.' },
      { title: 'Connect children to trusted adults', body: 'Link parents, guardians or other relatives to the child. Guardian records can show the relationship and indicate pickup authorization or emergency contact status.' },
      { title: 'Bring in existing records', body: 'Use the children’s spreadsheet import to review and bring in existing records, including guardian matching details. Authorized staff can review a child’s record and linked contacts in one place.' },
    ],
    example: 'When two siblings join the children’s ministry, create a record for each child and link both to the same guardian. Staff can find the correct contact from either child’s record without maintaining separate contact lists.',
    questions: [
      { question: 'Can a child be linked to more than one guardian?', answer: 'Yes. A child can have more than one linked adult, with their relationship and contact information shown in the child’s record.' },
      { question: 'Can we start with a spreadsheet?', answer: 'The children’s module provides a spreadsheet import and validation so staff can review the records and guardian details before saving them.' },
    ],
    related: ['membership', 'multi-branch'],
  },
  {
    slug: 'attendance',
    label: 'QR attendance and check-in',
    heading: 'Church attendance software with QR check-in',
    description: 'Set up a service check-in, record attendance with QR codes and bring first-time visitors into a follow-up queue in ICIMS.',
    intro: 'ICIMS helps churches record who attended a service and identify first-time visitors for follow-up. Members can scan a service QR code, or ushers can scan member codes at the door.',
    steps: [
      { title: 'Set up the service', body: 'Create a service for the relevant branch and schedule its date and time. Open the check-in link or scanner for that service.' },
      { title: 'Choose a check-in method', body: 'Display a service QR code for people to scan on their phones, or have ushers scan member QR codes. Record first-time visitors under the appropriate visitor category.' },
      { title: 'Review attendance and follow up', body: 'Review attendance against the service record. Eligible first-timer entries appear in discipleship intake so authorized staff can contact visitors and confirm consent before starting a journey.' },
    ],
    example: 'At Sunday service, ushers scan returning members’ codes while the welcome team helps new visitors check in. After the service, the attendance team reviews the totals and the follow-up team works from First Timer intake.',
    questions: [
      { question: 'Do people have to scan their own code?', answer: 'The church can display a service code for self check-in or use an usher-operated scanner for member codes.' },
      { question: 'Does check-in enroll visitors in a discipleship course?', answer: 'Check-in adds eligible visitors to intake. Staff contact the person, obtain consent and select a published workflow before starting a journey.' },
    ],
    related: ['membership', 'discipleship'],
  },
  {
    slug: 'discipleship',
    label: 'Discipleship management',
    heading: 'Church discipleship and follow-up software',
    description: 'Move from first-timer follow-up to discipleship journeys with stages, mentor meetings, class check-in and graded assessments in ICIMS.',
    intro: 'ICIMS connects first-timer intake with discipleship workflows. Staff can record consent, assign a mentor and guide each candidate through courses, practical tasks and assessments.',
    steps: [
      { title: 'Build and publish a workflow', body: 'Create stages such as welcome, foundation school and placement. Save work in progress as a draft, then publish it when the stages and requirements are ready. Reuse courses, tasks, milestones, approvals and assessments across workflows.' },
      { title: 'Contact and enroll a candidate', body: 'Check First Timer intake for eligible service check-ins, or create a journey manually. Record consent, choose a published workflow and invite the candidate to activate their portal account if they need access.' },
      { title: 'Teach and check progress', body: 'Assign a mentor and schedule follow-ups. Add documents, audio, video or links to a course, enroll candidates in a scheduled class, and record attendance with a QR code or session code. Candidates can submit question-based assessments for automatic grading.' },
      { title: 'See who needs follow-up', body: 'Review candidates by stage, overdue follow-ups, attendance and dropout points. Required items control when a candidate can advance. Complete the journey and apply a planned team or cell placement when ready.' },
    ],
    example: 'Build a Foundation School course with curriculum materials and scheduled sessions. Attach that course to the Foundation stage, then use a welcome call in the first stage and a placement approval in the last stage.',
    questions: [
      { question: 'Can candidates sign in and see their journey?', answer: 'Authorized staff can send a portal invitation from a journey. The candidate activates the account and signs in to access their journey and eligible learning activities.' },
      { question: 'Does every stage need a course?', answer: 'Stages can use different requirements. A welcome stage can use a manual task, a learning stage can use a course and a final stage can use an approval.' },
    ],
    related: ['attendance', 'membership'],
  },
  {
    slug: 'giving',
    label: 'Church giving and pledges',
    heading: 'Church giving and pledge management software',
    description: 'Create giving campaigns, record contributions, follow up on pledges and review transactions across ministry branches with ICIMS.',
    intro: 'ICIMS connects giving campaigns, contribution records and pledges. Finance teams can follow a campaign from launch through reconciliation and see where commitments still need attention.',
    steps: [
      { title: 'Set up a giving campaign', body: 'Create a campaign for the appropriate church or ministry branches. Share its public giving link when online contributions are enabled.' },
      { title: 'Record commitments and contributions', body: 'Track tithes, offerings and pledges. Filter pledge records by campaign or church to follow up on outstanding balances.' },
      { title: 'Review transactions and payouts', body: 'Review payment records and wallet history in the dashboard. Give finance staff permissions that reflect their responsibilities.' },
    ],
    example: 'For a building fund, create a giving campaign and record member pledges. During review, compare contributions with outstanding pledge balances and follow up on commitments that are still open.',
    questions: [
      { question: 'Can a church share a campaign publicly?', answer: 'Yes. Public giving pages give churches a link to share with their congregation. Online payment options depend on the church’s market and configuration.' },
      { question: 'Can authorized staff review giving by branch?', answer: 'ICIMS supports church and campaign filters for pledge tracking, with visibility determined by the staff member’s permissions.' },
    ],
    related: ['multi-branch', 'membership'],
  },
  {
    slug: 'multi-branch',
    label: 'Multi-branch church administration',
    heading: 'Multi-branch church management software',
    description: 'Manage church branches under one ICIMS ministry account with branch-level records, staff permissions and ministry reporting.',
    intro: 'ICIMS lets a ministry organize churches and branches in a shared system. Branch teams can handle local operations while authorized ministry leaders see the information relevant to their oversight.',
    steps: [
      { title: 'Set up the ministry structure', body: 'Create churches and branches in the system. Assign operational records such as members, services and resources to the church that is responsible for them.' },
      { title: 'Set staff roles and visibility', body: 'Create roles for responsibilities such as administration, check-in and finance. Grant staff the permissions and church access they need for daily work.' },
      { title: 'Review activity across the ministry', body: 'Use the reporting and performance views to review membership, attendance and giving. Use church filters where available to move from a broader overview to branch records.' },
    ],
    example: 'A ministry with three locations can give local staff responsibility for their services and members. Authorized ministry staff can use reporting to compare participation and plan support across locations.',
    questions: [
      { question: 'Can a branch manage its own services?', answer: 'Yes. A service can be created for a specific church or branch, and authorized staff can manage its check-in and attendance records.' },
      { question: 'Can staff have different permissions?', answer: 'Yes. ICIMS supports configurable roles and permissions so access can reflect responsibilities and church scope.' },
    ],
    related: ['membership', 'giving', 'asset-booking'],
  },
  {
    slug: 'asset-booking',
    label: 'Asset and facility booking',
    heading: 'Church asset and facility booking software',
    description: 'Reserve halls, rooms, vehicles and equipment for church services or events. Track requests, approvals and scheduling conflicts in ICIMS.',
    intro: 'ICIMS gives ministries one place to see who reserved a room, vehicle or piece of equipment, for what activity and when. The booking workflow checks for overlapping reservations and can require approval for selected resources.',
    steps: [
      { title: 'Create a resource catalogue', body: 'Add halls, rooms, projectors, instruments or vehicles. Record the resource’s branch, location and custodian, and choose whether other branches can request it.' },
      { title: 'Book for a service or event', body: 'Select the service or event when creating a reservation. When booking from the activity itself, start with its scheduled time and adjust the reservation window if needed.' },
      { title: 'Allow time for setup and handover', body: 'Set buffers before or after bookings for setup, cleanup or travel. Review requests that require approval and use the date and resource filters to check upcoming activity.' },
    ],
    example: 'Reserve a projector for a Saturday training event. Give the team 30 minutes before the start for setup and 15 minutes after the event to pack it away. Those buffers help protect the equipment from conflicting bookings.',
    questions: [
      { question: 'Can a church require approval for a vehicle reservation?', answer: 'Yes. Enable the approval setting on the vehicle so requests can be reviewed before confirmation.' },
      { question: 'Can the booking time differ from the event time?', answer: 'Yes. The event provides a starting date and time, and the requester can edit the booking window.' },
    ],
    related: ['events', 'calendar', 'multi-branch'],
  },
  {
    slug: 'calendar',
    label: 'Church and ministry calendar',
    heading: 'Church calendar and ministry scheduling software',
    description: 'See services, events, cell meetings, reminders and giving deadlines in month and agenda views. Filter by branch, activity and status.',
    intro: 'The ICIMS calendar brings scheduled ministry activity into one place. Church teams can see what is coming up, what is active, and which deadlines need attention across the branches they can access.',
    steps: [
      { title: 'See activities together', body: 'Find church events, services, cell meetings, reminders, giving campaign deadlines and pledge due dates from their respective modules.' },
      { title: 'Plan a month or work through an agenda', body: 'Switch between the month and agenda views. Filter by branch, activity type and status to focus on the work relevant to your team.' },
      { title: 'Follow an activity back to its module', body: 'Open related records from the calendar where available, and export the calendar when your role allows it.' },
    ],
    example: 'Before planning a Saturday outreach, a coordinator checks the branch calendar for events and cell meetings. The coordinator switches to the agenda view to review the week’s events and reminders in order.',
    questions: [
      { question: 'Do I have to re-enter events in the calendar?', answer: 'The calendar draws supported activities from the corresponding ICIMS modules, so scheduled events and services are visible alongside other activity.' },
      { question: 'Can I focus on one church branch or activity type?', answer: 'Yes. Authorized staff can filter the calendar by branch, activity type and status.' },
    ],
    related: ['events', 'asset-booking', 'attendance'],
  },
  {
    slug: 'events',
    label: 'Church events and ticketing',
    heading: 'Church event management and ticketing software',
    description: 'Plan conferences, meetings and outreach, publish event details, manage ticketed gatherings and connect events to asset bookings.',
    intro: 'ICIMS helps a church team plan an event, share the details and manage attendance or ticketing from the same system. Events can be set up for a single church, selected branches or the ministry.',
    steps: [
      { title: 'Schedule the gathering', body: 'Set the date, time and venue for a meeting, conference, outreach or fellowship. Choose which churches the event is available to.' },
      { title: 'Publish details and decide on tickets', body: 'Share a public event link where appropriate. If the event needs tickets, set availability, a sales cutoff and a price for paid gatherings.' },
      { title: 'Coordinate resources and check-in', body: 'Request a hall, vehicle or equipment from the event. For ticketed gatherings, review ticket records and use the event check-in tools to manage arrivals.' },
    ],
    example: 'For a ministry conference, set the event capacity and ticket cutoff, publish the event link, then request the hall and projectors. On the day, the welcome team can check in attendees and the organizer can review ticket records.',
    questions: [
      { question: 'Does every event need tickets?', answer: 'Ticketing is optional. Churches can create regular events and use free or paid tickets when a gathering needs them.' },
      { question: 'Can branches share an event?', answer: 'Yes. Event organizers can choose one church, selected churches or all churches when they have the relevant permissions.' },
    ],
    related: ['calendar', 'asset-booking'],
  },
];

export function featurePath(slug: string) {
  return `/features/${slug}`;
}
