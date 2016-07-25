/**
 * Rate My FIU - Chrome Extension
 * This is the main file for the extension.
 * Created by: Christian Canizares - ccani008@fiu.edu
 */
var professorName = ""; // The name of the professor currently being searched
var ratingsPageURL = ""; // The url for the actual ratemyprofessors rating page
var searchPageURL = ""; // The url for the search page at ratemyprofessors
var professorRating = ""; // The rating of the professor

// Object to hol all the professors already searched so we do not have to make
// so many requests.
var professors = {};

var firstTry;

// This is the ID that professors are listed under in the HTML. This changes depending on how the user got to the class page.
// Initialized to MTGPAT_INSTR$ assuming the user got their by going through "My requirements" in the enroll page. See method: getUserMethod()
var professorMethodID = "MTGPAT_INSTR$";

/**
 * This listens for any change in the page and fires the listener function.
 * The timeout is so that it isn't fired several times.
 */
var timeout = null;
document.addEventListener("DOMSubtreeModified",
	function() {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(listener, 1000);
	}, false);

/**
 * This method is fired whenever there is a DOM modification on the current page.
 * Run the script if it detects a class search page
 */
function listener() {
	resetValues();
	if (getUserMethod()) {
		RunScript();
	}
}

/**
 * This method finds out which method the user took when getting to the enroll page. Depending on which method (through class search or my requirements)
 * the ID for the professor name changes.
 * Returns true whenever the user is at a class search page
 */
function getUserMethod() {

	try {
		var classSearchMethod = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById("MTG_INSTR$" + 0).innerHTML;

		if (classSearchMethod !== undefined) {
			professorMethodID = "MTG_INSTR$"; // User went through the class search page
			return true;
		}

	} catch (classSearchErr) {}

	try {
		var myRequirementsMethod = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById("MTGPAT_INSTR$" + 0).innerHTML;

		if (myRequirementsMethod !== undefined) {
			professorMethodID = "MTGPAT_INSTR$"; // User went through the my requirements page
			return true;
		}
	} catch (myRequirementsErr) {}

	return false;
}

/**
 * This is the main function of this script.
 * We start at first professor in list see currentProfessor.
 *
 * Only get the professor search page if its not undefined or staff.
 */
function RunScript() {

	professors.exits = function(name) {
		return this.hasOwnProperty(name);
	};

	var schoolName = encodeURI("florida international university");

	var professorIndex = 0;
	var currentProfessor = "";

	while (professorName !== "undefined") {

		getProfessorName(professorIndex);
		currentProfessor = professorName;

		if (isValidName(professorName)) {
			firstTry = true;
			getProfessorSearchPage(professorIndex, currentProfessor, schoolName);
		} else {
			professors.professorName = {};
			professors.professorName.professorRating = "N/A";
		}

		professorIndex++;
	}
}


/**
 * Function to determine if a professor is valid and should be searched.
 * Some denominations and tittles are excluded.
 * 
 * @param  String
 * @return String
 */
function isValidName(name) {

	return (professorName !== "Staff" &&
		professorName !== "undefined" &&
		professorName !== "TBA .");
}



/**
 * This function tries to get the professor name from the class search page in fiu.edu
 * Some classes have more than one professor; in which case we will take only the first
 * one.
 */
function getProfessorName(indexOfProfessor) {
	try {
		professorName = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById(professorMethodID + indexOfProfessor).innerHTML;

		professorName = professorName.split(",")[0];
		return professorName;

	} catch (err) {
		professorName = "undefined";
	}
}

/**
 * This function sends a message to the background page (see background.js), 
 * to retrieve the professor search page from ratemyprofessor.com
 */
function getProfessorSearchPage(professorIndex, CurrentProfessor, schoolName) {

	var message = {
		method: 'POST',
		action: 'xhttp',
		url: 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=' + schoolName + '&queryoption=HEADER&query=' + CurrentProfessor + '&facetSearch=true',
		data: '',
		link: searchPageURL,
		index: professorIndex,
		professor: CurrentProfessor
	};

	chrome.runtime.sendMessage(message, getProfessorSearchPageCallback);
}


function getProfessorSearchPageCallback(response, CurrentProfessor) {

	var responseText = response.response;

	var resultsTest = responseText.indexOf("Your search didn't return any results.");


	if (foundResult(responseText)) {

		var htmlDoc = getDOMFromString(responseText);

		var professorClass = htmlDoc.getElementsByClassName("listing PROFESSOR")[0].getElementsByTagName('a')[0];
		searchPageURL = "http://www.ratemyprofessors.com" + professorClass.getAttribute('href');

		getProfessorRating(response.professorIndex, searchPageURL);

	} else if(firstTry) {

		firstTry=false;
		professorName = getLastName(response.professorName);
		getProfessorSearchPage(response.professorIndex, professorName, encodeURI("florida international university"));
		console.log ("I will try again for " + professorName + " with :" + getLastName(professorName));
	}

}


/**
 * Determines if the response returned a result; otherwise the response will
 * contain the specified string bellow:
 * "Your search didn't return any results."
 * 
 * @param  string text The test to be checked
 * @return boolean     If there is a result true; otherwise false.
 */
function foundResult(text) {
	return (text.indexOf("Your search didn't return any results.") == -1);
}


// This function gets the professor rating from the professor page
function getProfessorRating(professorIndex, SearchPageURL) {

	var message = {
		method: 'POST',
		action: 'xhttp',
		url: searchPageURL,
		data: '',
		link: SearchPageURL,
		index: professorIndex

	};

	chrome.runtime.sendMessage(message, getProfessorRatingCallback);
}

function getProfessorRatingCallback(response) {

	var responseText = response.response;

	var htmlDoc = getDOMFromString(responseText);


	// check if professor rating is a number. This is needed because sometimes the professor has a page, however they have no rating.
	if (!isNaN(htmlDoc.getElementsByClassName("grade")[0].innerHTML)) {

		professorRating = htmlDoc.getElementsByClassName("grade")[0].innerHTML;
	}

	var professorID = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById(professorMethodID + response.professorIndex);

	addRatingToPage(professorID, professorRating, response.searchPageURL);
}


/**
 * Function to convert from text to a real DOM
 * 
 * @param  String
 * @return DOMObject
 */
function getDOMFromString(textHTML) {

	var tempDiv = document.createElement("div");
	tempDiv.innerHTML = textHTML.replace(/<script(.|\s)*?\/script>/g, '');

	return tempDiv;
}


/**
 *  This function adds the rating to the class search page. Depending on the score the color of it is changed
 */
function addRatingToPage(professorID, ProfessorRating, SearchPageURL) {

	var span = document.createElement('span'); // Created to separate professor name and score in the HTML

	var link = document.createElement('a');

	var space = document.createTextNode(" "); // Create a space between professor name and rating

	var professorRatingTextNode = document.createTextNode(ProfessorRating); // The text with the professor rating

	if (ProfessorRating < 3.5) {
		link.style.color = "#8A0808"; // red = bad
	} else if (ProfessorRating >= 3.5 && ProfessorRating < 4) {
		link.style.color = "#FFBF00"; // yellow/orange = okay
	} else if (ProfessorRating >= 4 && ProfessorRating <= 5) {
		link.style.color = "#298A08"; // green = good
	}

	span.style.fontWeight = "bold"; // bold it

	link.href = SearchPageURL; // make the link
	link.target = "_blank"; // open a new tab when clicked

	// append everything together
	link.appendChild(professorRatingTextNode);
	span.appendChild(space);
	span.appendChild(link);
	professorID.appendChild(span);
}

/**
 * This function simply resets the variables
 */
function resetValues() {
	professorName = "";
	ratingsPageURL = "";
	searchPageURL = "";
	professorRating = "";
}


/**
 * Function to get the last name from a person. 
 * We are using American English as the base for the
 * inferences.
 *
 * The following names are supported:
 * Doe 			=> 	Doe
 * John Doe 	=>	Doe
 * John M. Doe 	=>	Doe
 * 
 * @param  String
 * @return String
 */
function getLastName(fullName) {
	var comp = fullName.split(" ");

	if (comp.length == 1) {
		return comp[0]; //Case for Doe
	} else if (comp.length == 2) {
		return comp[1]; //case for John Doe
	} else if (comp.length == 3) {
		return comp[2]; //case for John M. Doe
	}
}