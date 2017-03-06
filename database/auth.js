/*DatabaseFirebase.auth().onAuthStateChanged((user) => {
	if(user){
		console.log(user);
	}
	else{
		var provider = new firebase.auth.GoogleAuthProvider();
		DatabaseFirebase.auth().signInWithPopup(provider).then((result) => {
			console.log(result);
		}).catch((err) => {
			console.error(err);
		})
	}
});*/


function DatabaseAuth(FirebaseInstance, DatabaseInstance){
	
	var Auth = {

		signInUser: () => {
			return new Promise((resolve, reject) => {
				var provider = new firebase.auth.GoogleAuthProvider();
				FirebaseInstance.auth().signInWithPopup(provider).then((data) => {
					var result = data.user;
					localStorage.setItem('fantasy-civics-userid', result.uid);
					resolve({
						userid: result.uid,
						name: result.displayName,
						email: result.email,
						image: result.photoURL
					});
				}).catch(reject);
			});
		},

		signOutUser: () => {
			localStorage.removeItem('fantasy-civics-userid');
			return FirebaseInstance.auth().signOut();
		},

		getCurrentUser: () => {
			return new Promise((resolve, reject) => {
				var userid = localStorage.getItem('fantasy-civics-userid');
				if(userid){
					resolve({
						userid: userid
					});
				}
				else{
					reject('No user currently authenticated.');
				}
			});
		}

	}

	return Auth;
}