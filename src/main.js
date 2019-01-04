import anime from "animejs";

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
