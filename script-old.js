/**
 * The deprecated script file. Keeping it here for memories sake :P
 */

//console.log("Prof Script Loaded");

function listener() {

	//console.log("Listener Fired");
	retrieveProfessors();

};

var professorLink = "s";
function retrieveProfessors()
{
	var professorClass = "";
	var professorName = null;
	var professorMTG_INSTR;
	console.log("MTGPAT_INSTR$")
	var professorDIV = "MTGPAT_INSTR$";
	var x = 0;
	professorName = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById('MTGPAT_INSTR$' + x).innerHTML;
	professorMTG_INSTR =  document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById('MTG_INSTR$' + x).innerHTML;
	console.log(professorName)
	//if(professorName !== null)
	//{
	//	professorDIV = "MTGPAT_INSTR$";
	//} else if (professorMTG_INSTR !== null)
	//{
	//	professorDIV = "MTG_INSTR$";
	//}
	while (professorName !== null)
	{
		professorName = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById(professorDIV + x).innerHTML;

		console.log("x = " + x + " Professor: " + professorName);
		// Send message to get search page.

		if(professorName != "staff") {
			chrome.runtime.sendMessage({
				method: 'POST',
				action: 'xhttp',
				url: 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=florida%20international%20university&queryoption=HEADER&query=' + professorName + '&facetSearch=true',
				data: '',
				professor: professorName,
				indexA: x
			}, function(responseText) {

					var myHTML = responseText.response;
					var tempDiv = document.createElement('div');
					tempDiv.innerHTML = myHTML.replace(/<script(.|\s)*?\/script>/g, '');

					// tempDiv now has a DOM structure:
					tempDiv.childNodes;
					professorClass = tempDiv.getElementsByClassName("listing PROFESSOR")[0].getElementsByTagName('a')[0]; // etc. etc.
					professorLink = professorClass.getAttribute('href');
					var CurrentProfessor = responseText.professor;
					var index = responseText.indexA;
					//console.log("Response Recieved for URL PAGE for Professor: " + CurrentProfessor);


					chrome.runtime.sendMessage({
					method: 'POST',
					action: 'xhttp',
					url: 'http://www.ratemyprofessors.com' + professorLink,
					data: '',
					professor: CurrentProfessor,
					indexA: index

				}, function(responseText) {
						//console.log('Response from Professor Page'); // etc. etc.

						var url = "http://www.ratemyprofessors.com" + professorLink;
						var myHTML = responseText.response;
						var tempDiv = document.createElement('div');
						tempDiv.innerHTML = myHTML.replace(/<script(.|\s)*?\/script>/g, '');
						// tempDiv now has a DOM structure:
						tempDiv.childNodes;
						var ProfessorScore = tempDiv.getElementsByClassName("grade")[0].innerHTML;
						var ProfessorDiv = document.getElementById('ptifrmtgtframe').contentWindow.document.getElementById(professorDIV + responseText.indexA);
						console.log(CurrentProfessor+ ': ' + ProfessorScore);
						AddProfessorInfo(CurrentProfessor, ProfessorScore, ProfessorDiv, responseText);



				});

			});
		}

	x = x +1;

	}
}



function AddProfessorInfo(CurrentProfessor, ProfessorScore, ProfessorDiv, responseText)
{
		if(CurrentProfessor != "Staff")
		{
			if(responseText.response != "undefined")
			{
				//console.log(ProfessorDiv);

				var span = document.createElement('span');
				var content = document.createTextNode(" " + ProfessorScore);
				if(ProfessorScore < 3.5){

					span.style.color = "#8A0808";
				}
				else if (ProfessorScore >= 3.5 && ProfessorScore < 4 )
				{
					span.style.color = "#FFBF00";
				}
				else if (ProfessorScore >= 4 && ProfessorScore <= 5 )
				{
					span.style.color = "#298A08";
				}
				span.style.fontWeight = "bold";
				span.appendChild(content);
				ProfessorDiv.appendChild(span);
			}

		}
}


/* Listener to check if page has changed to reload the script, timeout is so that it isn't fired several times */
