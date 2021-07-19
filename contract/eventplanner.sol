// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract EventPlanner {
    
    
    uint256 internal userIndex = 1;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
   
    
    modifier onlyEventOwner(string memory _id) {
        require(msg.sender == events[_id].owner,"Only Campaign owner can call this function.");
        _;
    }
    

    mapping (string => Event) internal events;
    
    struct venueLocation {
        string venueAddress;
        string city;
        string stateProvince;
        uint postalCode;
        string country;
    }
    
    struct eventLink {
        string faceBook;
        string skype;
        string youTube;
        string googleMeet;
        string other;
    }

    struct datenTime {
        string startDate;
        string endDate;
        string startTime;
        string endTime;
        string timeZone;
    }


    struct Event {
        address payable owner;
        string eventTitle;
        string organizer;
        string image;
        string eventType;
        string description;
        string locationType;
        string donationMessage;
        uint totaldonations;
        uint attendance;
        bool isEventActive;
        bool isDonationActive;

        mapping (string => venueLocation) locations;
        mapping (string => datenTime) dates;
        mapping (string => eventLink) elink;
        mapping (address => uint) donations;
        mapping (address => uint) attendees;
        
    }
    
    function writeEvent(
        string memory _eventTitle,
        string memory _id,
        string memory _organizer,
        string memory _image,
        string memory _eventType,
        string memory _description,
        string memory _locationType,
        venueLocation memory _locations,
        eventLink memory _link,
        datenTime  memory _datenTime
    ) public {

        Event storage _event = events[_id];
        _event.owner = payable(msg.sender);
        _event.eventTitle = _eventTitle;
        _event.organizer = _organizer;
        _event.image = _image;
        _event.eventType = _eventType;
        _event.description = _description;
        _event.locationType = _locationType;
        _event.donationMessage = "";
        _event.totaldonations = 0;
        _event.attendance = 0;
        _event.isEventActive = true;
        _event.isDonationActive = false;
        _event.locations[_id] = _locations;
        _event.dates[_id] = _datenTime;
        _event.elink[_id] = _link;
    }
    
    function writeDonationMsg(string memory _id, string memory _donationMsg) public {
        events[_id].donationMessage = _donationMsg;
        events[_id].isDonationActive = true;
    }

    
    // Tuples are passed in with [] not ()
    function getEventinfo(string memory _id) public view returns(address payable, string memory, string memory, string memory, string memory, string memory, uint){
            return(
                events[_id].owner,
                events[_id].eventTitle,
                events[_id].organizer,
                events[_id].image,
                events[_id].eventType,
                events[_id].description,
                events[_id].attendance
                );
    }
 
    
    function getDatesnTime(string memory _id) public view returns(string memory, string memory, string memory, string memory, string memory){
        return( events[_id].dates[_id].startDate,
            events[_id].dates[_id].endDate,
            events[_id].dates[_id].startTime,
            events[_id].dates[_id].endTime,
            events[_id].dates[_id].timeZone
            );
    }
    
    function getLocation(string memory _id) public view returns(string memory, string memory, string memory, string memory, uint, string memory){
        return(
            events[_id].locationType,
            events[_id].locations[_id].venueAddress,
            events[_id].locations[_id].city,
            events[_id].locations[_id].stateProvince,
            events[_id].locations[_id].postalCode,
            events[_id].locations[_id].country
            );
    }
    
    
    function getLinks(string memory _id) public view returns(string memory, string memory, string memory, string memory, string memory){
        return(
            events[_id].elink[_id].youTube,
            events[_id].elink[_id].faceBook,
            events[_id].elink[_id].googleMeet,
            events[_id].elink[_id].skype,
            events[_id].elink[_id].other
            );
    }
    
    function getDonationMsg(string memory _id) public view returns(string memory){
        return events[_id].donationMessage;
    }
    
    function makeDonation(string memory _id, uint _donation) public payable {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(msg.sender, events[_id].owner, _donation),
                "Transfer failed"
        );
        events[_id].donations[msg.sender] = _donation;
        events[_id].totaldonations = events[_id].totaldonations + _donation;
    }
    
    function joinEvent(string memory _id) public {
        events[_id].attendance++;
        events[_id].attendees[msg.sender] = userIndex;
        userIndex++;
    }
    
    function closeEvent(string memory _id) public onlyEventOwner(_id){
            events[_id].isEventActive = false;
    }

    function showUserDonation(string memory _id) public view returns(uint){
        return events[_id].donations[msg.sender];
    }
    
    function showTotalDonations(string memory _id) public view returns(uint){
        return events[_id].totaldonations;
    }
    
    function checkEventStatus(string memory _id) public view returns(bool){
        return events[_id].isEventActive;
    }
    
    function checkForDonation(string memory _id) public view returns(bool){
        return events[_id].isDonationActive;
    }
    
    function hasUserJoined(string memory _id, address user) public view returns(bool){
        if(events[_id].attendees[user] != 0){
            return true;
        }else{
            return false;
        }
    }
    
}