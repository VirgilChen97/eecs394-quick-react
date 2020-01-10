import React, { useState, useEffect } from 'react';
import 'rbx/index.css';
import { Button, Container, Title, Message } from 'rbx';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import CourseList from './components/CourseList'

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

const meetsPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

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