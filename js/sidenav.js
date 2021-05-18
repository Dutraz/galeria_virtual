sidebar = false

function changeNav() {
    if (!!sidebar) {
        document.getElementById("mySidenav").style.width = "0";
    } else {
        document.getElementById("mySidenav").style.width = "250px";
    }
    sidebar = !sidebar
}

$('.sidenav a').click(function () {
    changeNav()
});