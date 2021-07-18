import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import eventplannerAbi from '../contract/eventplanner.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const EVContractAddress = "0x890F6299310d8b870070681f8af2953ffAabC63D"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let events = {}
let contract
let kit
let isDonationMsgActive
let eID
let hasUserJoined
let isUserOwner

/// Blockchain functions

const connectCeloWallet = async function () {
  if (window.celo) {
      notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()
  
      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)
  
      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(eventplannerAbi, EVContractAddress)

  
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
  }
  
  const getBalance = async function (){
  notification("⌛ Loading...")
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
  }
  
const getEvent = async function(_ID) {
  notification("⌛ Loading...")
  const _details = []
  let _eventinfo = new Promise(async (resolve, reject) => {
    let p = await contract.methods.getEventinfo(_ID).call()
    resolve({
      eventID: _ID,
      owner: p[0],
      eventTitle: p[1],
      organizers: p[2],
      image: p[3],
      eventType: p[4],
      eventDescription: p[5],
      attendees: p[6],
    })
  })
  let _eventVenueinfo = new Promise(async (resolve, reject) => {
    let p = await contract.methods.getLocation(_ID).call()
    resolve({
      locationtype: p[0],
      address: p[1],
      city: p[2],
      region: p[3],
      postalCode: p[4],
      country: p[5],
    })
  })
  let _eventLinkinfo = new Promise(async (resolve, reject) => {
    let p = await contract.methods.getLinks(_ID).call()
    resolve({
      youtube: p[0],
      facebook: p[1],
      googleMeet: p[2],
      skype: p[3],
      others: p[4],
    })
  })
  let _eventDateinfo = new Promise(async (resolve, reject) => {
    let p = await contract.methods.getDatesnTime(_ID).call()
    resolve({
      eventStart: p[0],
      eventEnds: p[1],
      startTime: p[2],
      endTime: p[3],
      timeZone: p[4],
    })
  })
  for (let promise of [_eventinfo, _eventVenueinfo, _eventLinkinfo, _eventDateinfo]) {
    try {
      const details = await promise
      events = {...events, ...details}
    }
    catch (err) {
      notification(`⚠️ ${err}.`)
    }
  }

  events["isEventActive"] = await contract.methods.checkEventStatus(_ID).call()
  isDonationMsgActive = await contract.methods.checkForDonation(_ID).call()

  if (isDonationMsgActive == true){
    events["donationMessage"] = await contract.methods.getDonationMsg(_ID).call()
    events["totalDonations"] = await contract.methods.showTotalDonations(_ID).call()
  }
  else {
    events["donationMessage"] = ""
    events["totalDonations"] = ""
  }

  hasUserJoined = await contract.methods.hasUserJoined(_ID, kit.defaultAccount).call()
  
  if(kit.defaultAccount == events.owner){
    isUserOwner = true
  }else{ isUserOwner = false}
  
  renderEvent()
}


async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(EVContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}



/// Created functions
function eventTemplate(_event){ 
  let locationDetail1 
  let locationDetail2
  let locationDetail3
  let locationDetail4
  let locationDetail5
  let date

  if (events.eventStart == events.eventEnds){
    date = events.eventStart
  } else{
    date = events.eventStart + " - " + events.eventEnds
  }

    if (_event.locationtype == "Online Event"){
        locationDetail1=_event.youtube
        locationDetail2=_event.zoom
        locationDetail3=_event.googleMeet
        locationDetail4=_event.skype
        locationDetail5=_event.others 
    }else{
        locationDetail1=_event.address
        locationDetail2=_event.city
        locationDetail3=_event.region
        locationDetail4=_event.postalCode
        locationDetail5=_event.country
    }

    return`
        <div class="modal-content">
          <div class="modal-content" id="newUser">
            <div class="modal-header">
              <h6 class="modal-title" id="eventModals" style="padding-right: 5px;">Event ID:</h6><span>${_event.eventID}</span>
              <button type="button" class="btn-close closeModal" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="card mb-4">
                <img class="card-img-top" src="${_event.image}" alt="...">
                <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start" id="attendees">
                  <i class="bi bi-people-fill"></i>&nbsp;${_event.attendees}
                </div>
                <div class="card-body text-left p-4 position-relative">
                  <div class="translate-middle-y position-absolute top-0" id="identicon">
                    ${_event.attendees}3
                  </div>
                  <h2 class="card-title fs-4 fw-bold mt-2">${_event.eventTitle}</h2>

                  <p class="card-text mb-4" style="min-height: 50px">
                    ${_event.eventTitle}
                  </p>
                  <p class="card-text" style="text-align: left !important;" id="Venues">
                    <i class="bi bi-geo-alt-fill"></i>&nbsp;
                    Address
                  </p>
                  <p class="card-text" id="Date" style="text-align: left;">
                    <i class="bi bi-calendar2-event-fill"></i>&nbsp;
                    july${_event.attendees}
                  </p>
                  <p class="card-text" id="Time" style="text-align: left;">
                    <i class="bi bi-clock-fill"></i>&nbsp;
                    Time
                  </p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-lg btn-block joinEventBtn" data-bs-dismiss="modal">Join Event</button>
            </div>
          </div>

          <div class="modal-content" id="oldUser">
            <div class="modal-header">
              <h6 class="modal-title" id="eventModals" style="padding-right: 5px;">Event ID:</h6><span>${_event.eventID}</span>
              <button type="button" class="btn-close closeModal" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="card mb-4">
                <img class="card-img-top" src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80" alt="...">
                <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start" id="attendees">
                  <i class="bi bi-people-fill"></i>&nbsp;${_event.attendees}
                </div>
                <div class="card-body text-left p-4 position-relative">
                  <div class="translate-middle-y position-absolute top-0" id="identicon">
                    ${identiconTemplate(_event.owner)}
                  </div>
                  <h2 class="card-title fs-4 fw-bold mt-2">Party</h2>

                  <p class="card-text mb-4" style="min-height: 50px">
                    ${_event.eventTitle}
                  </p>
                  <p class="card-text" style="text-align: left !important;" id="Venues">
                    <i class="bi bi-geo-alt-fill"></i>&nbsp;
                    ${locationDetail1}, ${locationDetail2}, ${locationDetail3}, ${locationDetail4}, ${locationDetail5}
                  </p>
                  <p class="card-text" id="Date" style="text-align: left;">
                    <i class="bi bi-calendar2-event-fill"></i>&nbsp;
                    ${date}
                  </p>
                  <p class="card-text" id="Time" style="text-align: left;">
                    <i class="bi bi-clock-fill"></i>&nbsp;
                    ${_event.startTime} - ${_event.endTime} ${_event.timeZone}
                  </p>
                  <span class="card-text" id="donaMsg" style="text-align: left;">
                    You can also support us below
                  </span>
                  <div class="form-check" style="text-align: left; margin: 0; margin-right: 20px;">
                    <input class="form-check-input donatebox" type="checkbox" value="option5" id="donationBox" data-r-show-target=".option-5">
                    <label class="form-check-label" for="flexCheckDefault">Make Donations</label>
                  </div>
                  <div class="option-5 is-hidden" style="display:flex; flex-direction: row;">
                    <div class="mb-2" style="display:flex; flex-direction: row; vertical-align: middle; align-items: center;">
                      <label for="_donations" style="display: flex;">Enter Amount:</label>&nbsp;
                      <input type="text" class="form-control" id="_donations" placeholder="0" style="width: 40%; height: min-content;">&nbsp;cUSD
                    </div>
                    <button type="button" class="btn btn-sm btn-dark" style="height: min-content;" id="donate">donate</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-dark" data-bs-dismiss="modal" id="userStatus" disabled> Joined</button>
            </div>
          </div>

          <div class="modal-content" id="eventCreator">
            <div class="modal-header">
              <h6 class="modal-title" id="eventModals" style="padding-right: 5px;">Event ID:</h6><span>${_event.eventID}</span>
              <button type="button" class="btn-close closeModal" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="card mb-4">
                <img class="card-img-top" src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80" alt="...">
                <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start" id="attendees">
                  <i class="bi bi-people-fill"></i>&nbsp;${_event.attendees}
                </div>
                <div class="card-body text-left p-4 position-relative">
                  <div class="translate-middle-y position-absolute top-0" id="identicon">
                    ${identiconTemplate(_event.owner)}
                  </div>
                  <h2 class="card-title fs-4 fw-bold mt-2">${_event.eventTitle}</h2>

                  <p class="card-text mb-4" style="min-height: 50px">
                    ${_event.eventTitle}
                  </p>
                  <p class="card-text" style="text-align: left !important;" id="Venues">
                    <i class="bi bi-geo-alt-fill"></i>&nbsp;
                    ${locationDetail1}, ${locationDetail2}, ${locationDetail3}, ${locationDetail4}, ${locationDetail5}
                  </p>
                  <p class="card-text" id="Date" style="text-align: left;">
                    <i class="bi bi-calendar2-event-fill"></i>&nbsp;
                    ${date}
                  </p>
                  <p class="card-text" id="Time" style="text-align: left;">
                    <i class="bi bi-clock-fill"></i>&nbsp;
                    ${_event.startTime} - ${_event.endTime} ${_event.timeZone}
                  </p>
                  <p class="card-text" id="total_donations" style="text-align: left;">
                    <i class="bi bi-cash-coin"></i>&nbsp;Total Donations = 1000cUSD
                  </p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-dark" data-bs-dismiss="modal"> Close Event</button>
            </div>
          </div>

          <div class="modal-content" id="eventClosed">
            <div class="modal-header">
              <h6 class="modal-title" id="eventModals" style="padding-right: 5px;">Event ID:</h6><span>${_event.eventID}</span>
              <button type="button" class="btn-close closeModal" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="card mb-4">
                <img class="card-img-top" src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80" alt="...">
                <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start" id="attendees">
                  <i class="bi bi-people-fill"></i>&nbsp;${_event.attendees}
                </div>
                <div class="card-body text-left p-4 position-relative">
                  <div class="translate-middle-y position-absolute top-0" id="identicon">
                    ${identiconTemplate(_event.owner)}
                  </div>
                  <h2 class="card-title fs-4 fw-bold mt-2">${_event.eventTitle}</h2>

                  <p class="card-text mb-4" style="min-height: 50px">
                    ${_event.eventTitle}
                  </p>
                  <p class="card-text" style="text-align: left !important;" id="Venues">
                    <i class="bi bi-geo-alt-fill"></i>&nbsp;
                    ${locationDetail1}, ${locationDetail2}, ${locationDetail3}, ${locationDetail4}, ${locationDetail5}
                  </p>
                  <p class="card-text" id="Date" style="text-align: left;">
                    <i class="bi bi-calendar2-event-fill"></i>&nbsp;
                    ${date}
                  </p>
                  <p class="card-text" id="Time" style="text-align: left;">
                    <i class="bi bi-clock-fill"></i>&nbsp;
                    ${_event.startTime} - ${_event.endTime} ${_event.timeZone}
                  </p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-lg btn-block" data-bs-dismiss="modal" disabled>Event is closed</button>
            </div>
          </div>
        </div>
        
        `
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()
    return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

function editEventModal() {
  if(hasUserJoined){
    $("#newUser").addClass('is-hidden')
    $("#eventCreator").addClass('is-hidden')
    $("#eventClosed").addClass('is-hidden')
  }else if(isUserOwner){
    $("#newUser").addClass('is-hidden')
    $("#oldUser").addClass('is-hidden')
    $("#eventClosed").addClass('is-hidden')
  }else{
    $("#oldUser").addClass('is-hidden')
    $("#eventCreator").addClass('is-hidden')
    $("#eventClosed").addClass('is-hidden')
  }
}

function reEditEventModal() {
  $("#oldUser").removeClass('is-hidden')
  $("#eventCreator").removeClass('is-hidden')
  $("#eventClosed").removeClass('is-hidden')
  $("#newUser").removeClass('is-hidden')
}

function renderEvent() {
  document.getElementById("eventDisplay").innerHTML = ""
  const newDiv = document.createElement("div")
  newDiv.className = "modal-content"
  newDiv.innerHTML = eventTemplate(events)
  document.getElementById("eventDisplay").appendChild(newDiv)
  editEventModal()
  $("#eventDetailModal").modal('show');
  notificationOff()
}

function editAddress(_address){
  let address = document.querySelector(".addr")
  let add = _address
  add = add+'.'
  let str1 = add.slice(0,6);
  let str2 = add.slice(-5, -1);
  address.textContent = str1+'...'+str2
  address.style.display = 'flex'
  document.getElementById("blockchainlink").href=`https://alfajores-blockscout.celo-testnet.org/address/${kit.defaultAccount}/transactions`
}

function chooseModal(){
  let modal1 = document.getElementById("newuser")
  let modal2 = document.getElementById("oldUser")
  let modal3 = document.getElementById("eventCreator")
  let modal4 = document.getElementById("eventClosed")


}




/// Document Queries
document.querySelector("#newEventBtn").addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newEventTitle").value,
    document.getElementById("newEventID").value,
    document.getElementById("eventOrganizer").value,
    document.getElementById("newImgUrl").value,
    document.getElementById("newEventType").value,
    document.getElementById("newEventDescription").value,
    document.getElementById("newEventLocationType").value,
    [
      document.getElementById("newEventAddress").value,
      document.getElementById("newEventCity").value,
      document.getElementById("newEventRegion").value,
      document.getElementById("newEventPostalCode").value,
      document.getElementById("newEventCountry").value
    ],
    [
      document.getElementById("facebook").value,
      document.getElementById("skype").value,
      document.getElementById("youtube").value,
      document.getElementById("googleMeet").value,
      document.getElementById("others").value
    ],
    [
      document.getElementById("newEventStartDate").value,
      document.getElementById("newEventEndDate").value,
      document.getElementById("newEventStartTime").value,
      document.getElementById("newEventEndTime").value,
      document.getElementById("newEventTimezone").value
    ]
  ]

  notification(`⌛ Adding "${params[0]}"...`)  

  try {
    const result = await contract.methods
      .writeEvent(...params)
      .send({ from: kit.defaultAccount })
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }

  if (isDonationMsgActive == true){
    try { 
      const _donationMsg = [document.getElementById("newEventID").value,
       document.getElementById("donationMessage").value]
      const dMsg = await contract.methods
      .writeDonationMsg(..._donationMsg)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
  notification(`🎉 You successfully added "${params[0]}".`)
})

$(document).ready(()=>{
  $('.js-revealer').on('change', function(){
    var $select = $(this);
    var $selected = $select.find('option:selected');
    var hideSelector = $selected.data('r-hide-target');
    var showSelector = $selected.data('r-show-target');
        
    $(hideSelector).addClass('is-hidden');
    $(showSelector).removeClass('is-hidden');
  });

  $('input[type="checkbox"]').click(function(){
    var selected = $(this).data('r-show-target')
    if($(this).is(":checked")){
      $(selected).removeClass('is-hidden')
    }
    else if($(this).is(":not(:checked)")){
      $(selected).addClass('is-hidden')
    }
  });

  $("#donationBox").click(function() {
    if ($("input[type=checkbox]").is(
      ":checked")) {
        isDonationMsgActive = true
    } else {
        isDonationMsgActive = false
    }
  });

  $("#eventDetailModal").modal({
    backdrop: 'static',
    keyboard: false
  });

});

document.querySelector("#connectAccount").addEventListener("click",  async (e) => {
  await connectCeloWallet()
  await getBalance()
  document.querySelector("#connectAccount").style.display = "none"
  editAddress(kit.defaultAccount)
  $('.btnss').removeAttr("disabled");
  notificationOff()
})

document.querySelector("#findEventBtn").addEventListener("click",  async (e) => {
  eID = document.getElementById("eventID").value
  getEvent(eID)
})

document.querySelector("#eventDisplay").addEventListener("click", async (e) => {
  if (e.target.className.includes("joinEventBtn")) {
    $('#eventDetailModal').modal('hide');
    notification(` Joining ${events.eventTitle}...`)
    try { 
      const _join= await contract.methods
      .joinEvent(eID)
      .send({ from: kit.defaultAccount })  
    } 
      catch (error) { notification(`⚠️ ${error}.`)
     }
     notification(`🎉 You have successfully joined ${events.eventTitle}.`)
    }
  if (e.target.className.includes("closeModal")) {
    $('#eventDetailModal').modal('hide');
    }
  
  if (e.target.className.includes("donatebox")) {
    $('input[type="checkbox"]').click(function(){
      var selected = $(this).data('r-show-target')
      if($(this).is(":checked")){
        $(selected).removeClass('is-hidden')
      }
      else if($(this).is(":not(:checked)")){
        $(selected).addClass('is-hidden')
      }
    });
  }
  
})




