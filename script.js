/**
 * Rate My FIU - Chrome Extension
 * This is the main file for the extension.
 * Created by: Christian Canizares - ccani008@fiu.edu
 */

var professorName = ""; // The name of the professor currently being searched
var ratingsPageURL = "";// The url for the actual ratemyprofessors rating page
var searchPageURL = ""; // The url for the search page at ratemyprofessors
var professorRating = ""; // The rating of the professor

// This is the ID that professors are listed under in the HTML. This changes depending on how the user got to the class page.
// Initialized to MTGPAT_INSTR$ assuming the user got their by going through "My requirements" in the enroll page. See method: getUserMethod()
var professorMethodID = "MTGPAT_INSTR$"

/**
 * This listens for any change in the page and fires the listener function.
 * The timeout is so that it isn't fired several times.
 */
var timeout = null;
document.addEventListener("DOMSubtreeModified",
function()
{
	if(timeout)clearTimeout(timeout);
	timeout = setTimeout(listener, 1000);
}, false);

/**
 * This method is fired whenever there is a DOM modification on the current page
 */
function listener()
{
	// run the script if it detects a class search page
	if(getUserMethod())
	{
		RunScript();
	}
}

/**
 * This method finds out which method the user took when getting to the enroll page. Depending on which method (through class search or my requirements)
 * the ID for the professor name changes.
 * Returns true whenever the user is at a class search page
 */
function getUserMethod()
{
	try
	{
		var classSearchMethod = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById("MTG_INSTR$" + 0).innerHTML;
	} catch(classSearchErr) {}

	try
	{
		var myRequirementsMethod = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById("MTGPAT_INSTR$" + 0).innerHTML;
	} catch(myRequirementsErr) {}

	if(classSearchMethod != undefined)
	{
		professorMethodID = "MTG_INSTR$"; // User went through the class search page
		return true;
	}
	else if (myRequirementsMethod != undefined)
	{
		professorMethodID = "MTGPAT_INSTR$"; // User went through the my requirements page
		return true;
	}
}

/**
 * This is the main function of this script.
 */
function RunScript()
{
	var professorIndex = 0; // start at first professor in list
	var currentProfessor = "";
	while (professorName != "undefined")
	{

		getProfessorName(professorIndex)
		currentProfessor = professorName;
		// only get the professor search page if its not undefined or staff
		if(professorName != "Staff" && professorName != "undefined")
		{
			getProfessorSearchPage(professorIndex, currentProfessor);
		}

		professorIndex++;
	}
}


/**
 * This function tries to get the professor name from the class search page in fiu.edu
 */
function getProfessorName(indexOfProfessor)
{
	try
	{
		professorName = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById(professorMethodID + indexOfProfessor).innerHTML;
		return professorName;
	}
	catch (err)
	{
		professorName = "undefined"
	}
}


/**
 * This function sends a message to the background page (see background.js), to retrieve the professor search page from ratemyprofessor.com
 */
function getProfessorSearchPage(professorIndex, CurrentProfessor)
{
	// send message to background.js to avoid cross-domain policy
	//console.log("@getProfessorSearchPage Parameters: " + CurrentProfessor + " Index: " + professorIndex);

	chrome.runtime.sendMessage({
		method: 'POST',
		action: 'xhttp',
		url: 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=florida%20international%20university&queryoption=HEADER&query=' + CurrentProfessor + '&facetSearch=true',
		data: '',
		professor: CurrentProfessor,
		indexA: professorIndex
	}, function(response) {
		// TODO: make callback function not anonymous
			var myHTML = response.response;

			var tempDiv = document.createElement('div');

			tempDiv.innerHTML = myHTML.replace(/<script(.|\s)*?\/script>/g, '');

			var professorClass = tempDiv.getElementsByClassName("listing PROFESSOR")[0].getElementsByTagName('a')[0]; // etc. etc.

			searchPageURL =  "http://www.ratemyprofessors.com" + professorClass.getAttribute('href');

			getProfessorRating(response.professorIndex)
		});
}


// This function gets the professor rating from the professor page
function getProfessorRating(professorIndex)
{

	chrome.runtime.sendMessage({
		method: 'POST',
		action: 'xhttp',
		url: searchPageURL,
		data: '',
		professor: "CurrentProfessor",
		indexA: professorIndex

}, function(response) {
		// TODO: make callback function not anonymous
		//console.log('Response from Professor Page');
		var myHTML = response.response;

		var tempDiv = document.createElement('div');

		tempDiv.innerHTML = myHTML.replace(/<script(.|\s)*?\/script>/g, '');

		tempDiv.childNodes;

		professorRating = tempDiv.getElementsByClassName("grade")[0].innerHTML;

		console.log(professorRating);

		var professorID = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById(professorMethodID + response.professorIndex);

		addRatingToPage(professorID, professorRating);
	});
}

/**
 *  This function adds the rating to the class search page. Depending on the score the color of it is changed
 */
function addRatingToPage(professorID, ProfessorRating)
{
	var span = document.createElement('span'); // Created to separate professor name and score in the HTML

	var link = document.createElement('a');

	var space = document.createTextNode(" "); // Create a space between professor name and rating

	var professorRatingTextNode = document.createTextNode(ProfessorRating); // The text with the professor rating

	if(ProfessorRating < 3.5)
	{
		link.style.color = "#8A0808"; // red = bad
	}
	else if (ProfessorRating >= 3.5 && ProfessorRating < 4 )
	{
		link.style.color = "#FFBF00"; // yellow/orange = okay
	}
	else if (ProfessorRating >= 4 && ProfessorRating <= 5 )
	{
		link.style.color = "#298A08"; // green = good
	}

	span.style.fontWeight = "bold"; // bold it

	link.href = searchPageURL; // make the link
	link.target = "_blank"; // open a new tab when clicked

	// append everything together
	link.appendChild(professorRatingTextNode);
	span.appendChild(space);
	span.appendChild(link);
	professorID.appendChild(span);


}
