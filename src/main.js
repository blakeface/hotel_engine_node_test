import anime from "animejs";
import axios from "axios";

anime({
	targets: ".loading-block",
	translateX: el => {
		let parentWidth = parseInt(
			document.querySelector(".loading-block-wrapper").clientWidth
		);
		return parentWidth - el.clientWidth;
	},
	rotate: "1turn",
	direction: "alternate",
	loop: true,
	easing: "easeInOutQuad",
	duration: (el, i) => 1000 + i * 1000
});

// mock loading time of 2 seconds
window.setTimeout(
	() => axios.get("/api/data").then(results => thrashDom(results.data)),
	2000
);

function thrashDom(results) {
	const welcomeEl = document.querySelector(".welcome");
	const appEl = document.querySelector(".app");

	// update hidden classes
	welcomeEl.classList.add("hidden");
	appEl.classList.remove("hidden");

	// add li
	results.pulls.forEach((pull, i) => {
		const li = createListItem(pull);
		appEl.appendChild(li);
	});
}

function createListItem(pull) {
	const li = document.createElement("li");
	const content = document.createTextNode(
		"Pull Request: " + results.users.id
	);
	li.appendChild(content);
	return li;
}


