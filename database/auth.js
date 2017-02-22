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


function DatabaseAuth(FirebaseInstance){
	
	var Auth = {

		signInUser: () => {
			return new Promise((resolve, reject) => {
				var provider = new firebase.auth.GoogleAuthProvider();
				FirebaseInstance.auth().signInWithPopup(provider).then((data) => {
					var result = data.user;
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
			return FirebaseInstance.auth().signOut();
		},

		getCurrentUser: () => {
			return new Promise((resolve, reject) => {
				var result = DatabaseFirebase.auth().currentUser;
				if(result){
					resolve({
						userid: result.uid,
						name: result.displayName,
						email: result.email,
						image: result.photoURL
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