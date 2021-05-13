sideBar = false;
function changeSideBar(){
    sideBar = !sideBar
    if (sideBar){
        document.getElementById("mySidebar").style.width = "250px";
    } else {
        document.getElementById("mySidebar").style.width = "0";
    }
}