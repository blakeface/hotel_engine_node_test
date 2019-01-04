import anime from "animejs";
import axios from "axios";
import $ from "jquery";

$(document).ready(function() {
	// animate loading blocks
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
		const $appListEl = $(".app-list");
		const parseData = results.map(result => JSON.parse(result));

		// add li for each pull request
		parseData.forEach((pull, i) => {
			const $li = $("<li class='hidden'></li>");
			$(`<h5>Pull Request: <span>${pull.number}</span></h5>`).appendTo(
				$li
			);
			$(`<p>Requestee: <span>${pull.user.login}</span></p>`).appendTo(
				$li
			);
			$(`<p>Commits: <span>${pull.commits}</span></p>`).appendTo($li);
			$(`<p>Comments: <span>${pull.comments}</span></p>`).appendTo($li);
			$li.appendTo($appListEl);
		});

		// add sweet animation
		anime({
			targets: "li",
			translateX: -1000,
			direction: "reverse",
			duration: 3000,
			delay: 500,
			begin: anim => $("li").removeClass("hidden"),
			complete: anim => $("li").addClass("border-bottom")
		});

		// update hidden classes
		$(".welcome").addClass("hidden");
		$(".app").removeClass("hidden");
	}
});
