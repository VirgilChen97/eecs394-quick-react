import React, { useState, useEffect } from 'react';
import 'rbx/index.css';
import { Button, Container, Title, Message } from 'rbx';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

const terms = { F: 'Fall', W: 'Winter', S: 'Spring' };
const days = ['M', 'Tu', 'W', 'Th', 'F'];
const firebaseConfig = {
	apiKey: "AIzaSyD4Ph2v9VLa0EkAcyVNVV4D31xTc6z7cak",
	authDomain: "quickreact-dcd6c.firebaseapp.com",
	databaseURL: "https://quickreact-dcd6c.firebaseio.com",
	projectId: "quickreact-dcd6c",
	storageBucket: "quickreact-dcd6c.appspot.com",
	messagingSenderId: "1060437748264",
	appId: "1:1060437748264:web:893a5504749d21242d231d",
	measurementId: "G-SCTCHS94VX"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref();

const uiConfig = {
	signInFlow: 'popup',
	signInOptions: [
		firebase.auth.GoogleAuthProvider.PROVIDER_ID
	],
	callbacks: {
		signInSuccessWithAuthResult: () => false
	}
};

const Welcome = ({ user }) => (
	<Message color="info">
		<Message.Header>
			Welcome, {user.displayName}
			<Button primary onClick={() => firebase.auth().signOut()}>
				Log out
		</Button>
		</Message.Header>
	</Message>
);

const Banner = ({ user, title }) => (
	<React.Fragment>
		{user ? <Welcome user={user} /> : <SignIn />}
		<Title>{title || '[loading...]'}</Title>
	</React.Fragment>
);

const SignIn = () => (
	<StyledFirebaseAuth
		uiConfig={uiConfig}
		firebaseAuth={firebase.auth()}
	/>
);

const getCourseTerm = course => (
	terms[course.id.charAt(0)]
);

const getCourseNumber = course => (
	course.id.slice(1, 4)
)

const Course = ({ course, state, user }) => (
	<Button color={buttonColor(state.selected.includes(course))}
		onClick={() => state.toggle(course)}
		onDoubleClick={user ? () => moveCourse(course) : null}
		disabled={hasConflict(course, state.selected)}
	>
		{getCourseTerm(course)} CS {getCourseNumber(course)}: {course.title}
	</Button>
);

const moveCourse = course => {
	const meets = prompt('Enter new meeting data, in this format:', course.meets);
	if (!meets) return;
	const { days } = timeParts(meets);
	if (days) saveCourse(course, meets);
	else moveCourse(course);
};

const saveCourse = (course, meets) => {
	db.child('courses').child(course.id).update({ meets })
		.catch(error => alert(error));
};

const hasConflict = (course, selected) => (
	selected.some(selection => courseConflict(course, selection))
);

const meetsPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

const addCourseTimes = course => ({
	...course,
	...timeParts(course.meets)
});

const addScheduleTimes = schedule => ({
	title: schedule.title,
	courses: Object.values(schedule.courses).map(addCourseTimes)
});

const timeParts = meets => {
	const [match, days, hh1, mm1, hh2, mm2] = meetsPat.exec(meets) || [];
	return !match ? {} : {
		days,
		hours: {
			start: hh1 * 60 + mm1 * 1,
			end: hh2 * 60 + mm2 * 1
		}
	};
};

const CourseList = ({ courses, user }) => {
	const [term, setTerm] = useState('Fall');
	const [selected, toggle] = useSelection();
	const termCourses = courses.filter(course => term === getCourseTerm(course));

	return (
		<React.Fragment>
			<TermSelector state={{ term, setTerm }} />
			<Button.Group>
				{termCourses.map(course =>
					<Course key={course.id} course={course}
						state={{ selected, toggle }}
						user={user} />)}
			</Button.Group>
		</React.Fragment>
	);
};

const useSelection = () => {
	const [selected, setSelected] = useState([]);
	const toggle = (x) => {
		setSelected(selected.includes(x) ? selected.filter(y => y !== x) : [x].concat(selected))
	};
	return [selected, toggle];
};

const daysOverlap = (days1, days2) => (
	days.some(day => days1.includes(day) && days2.includes(day))
);

const hoursOverlap = (hours1, hours2) => (
	Math.max(hours1.start, hours2.start) < Math.min(hours1.end, hours2.end)
);

const timeConflict = (course1, course2) => (
	daysOverlap(course1.days, course2.days) && hoursOverlap(course1.hours, course2.hours)
);

const courseConflict = (course1, course2) => (
	course1 !== course2
	&& getCourseTerm(course1) === getCourseTerm(course2)
	&& timeConflict(course1, course2)
);

const buttonColor = selected => (
	selected ? 'success' : null
);

const TermSelector = ({ state }) => (
	<Button.Group hasAddons>
		{Object.values(terms)
			.map(value =>
				<Button key={value}
					color={buttonColor(value === state.term)}
					onClick={() => state.setTerm(value)}
				>
					{value}
				</Button>
			)
		}
	</Button.Group>
);

const App = () => {
	const [schedule, setSchedule] = useState({ title: '', courses: [] });
	const [user, setUser] = useState(null);

	useEffect(() => {
		const handleData = snap => {
			if (snap.val()) setSchedule(addScheduleTimes(snap.val()));
		};
		db.on('value', handleData, error => alert(error));
		return () => { db.off('value', handleData); };
	}, []);

	useEffect(() => {
		firebase.auth().onAuthStateChanged(setUser);
	}, []);

	return (
		<Container>
			<Banner title={schedule.title} user={user} />
			<CourseList courses={schedule.courses} user={user} />
		</Container>
	);
};

export default App;