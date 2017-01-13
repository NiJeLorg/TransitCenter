/*!
 * app.js: Javascript that controls the Transitcenter Public Bus Works Site
 */

function app() {}

app.init = function () {
    // set up CARTO SQL for querying
    app.username = 'busworks';
    // SQL client
    app.sqlclient = new cartodb.SQL({
        user: app.username,
        protocol: "https",
        sql_api_template: "https://{user}.cartodb.com:443"
    });

    // set up picture book
    if (($('body')).width() >= 767) {
      app.pictureBook();
    }

    // set up listeners
    app.createListeners();

    // get random persona
    app.randomPersona();

    // set up report card drop down menues
    app.createReportCardDropdowns(routeId);

    // set up initial report card map
    app.reportCardMap(routeId);

    // draw buses in bunching graphic
    app.bunchingBuses();

    // pull boundary values and initial route value
    app.initialDataBounds(routeId);

    //update share buttons
    app.updateShareButtons(routeId);


}

app.scrollingInteractions = function () {
    // get height of intro block and shrink navbar
    var introHeight = $(".intro").height() - 60;
    if ($("#fixedNav").offset().top >= introHeight && $('body').width() >= 1150) {
        $(".navbar-custom .navbar-brand .extra-text").css( "opacity", "0" );
        $(".navbar-custom .navbar-brand").css( "font-size", "32px" );
        $(".navbar-custom .navbar-brand").css( "width", "200px" );
        $(".navbar-custom").css( "min-height", "50px" );
    } else if ($('body').width() >= 1150){
        $(".navbar-custom .navbar-brand .extra-text").css( "opacity", "1" );
        $(".navbar-custom .navbar-brand").css( "font-size", "44px" );
        $(".navbar-custom .navbar-brand").css( "width", "600px" );
        $(".navbar-custom").css( "min-height", "120px" );
    } else {
        $(".navbar-custom .navbar-brand .extra-text").removeAttr('style');
        $(".navbar-custom .navbar-brand").removeAttr('style');
        $(".navbar-custom").removeAttr('style');
    }

    // variable set up
    var top_2_a, left_2_a, top_2_b, left_2_b, top_3_5_a, left_3_5_a, top_3_5_b, left_3_5_b, top_3_a, left_3_a, top_3_b, left_3_b, top_4, left_4, element, offsetTop;

    // check browser width and set tops and lefts
    if (($('body')).width() < 767) {
      // mobile
      top_2_a = '20vh';
      left_2_a = '40%';
      top_2_b = '20vh';
      left_2_b = '40%';
      top_3_5_a = '20vh';
      left_3_5_a = '32%';
      top_3_5_b = '25vh';
      left_3_5_b = '42%';
      top_3_a = '50vh';
      left_3_a = '45%';
      top_3_b = '40vh';
      left_3_b = '46%';
      top_4 = '60vh';
      left_4 = '46%';
    } else if (($('body')).width() < 1200) {
      // tablet
      top_2_a = '32vh';
      left_2_a = '60%';
      top_2_b = '20vh';
      left_2_b = '30%';
      top_3_5_a = '20vh';
      left_3_5_a = '65%';
      top_3_5_b = '30vh';
      left_3_5_b = '31%';
      top_3_a = '40vh';
      left_3_a = '31%';
      top_3_b = '30vh';
      left_3_b = '31%';
      top_4 = '50vh';
      left_4 = '32%';
    } else {
      top_2_a = '42vh';
      left_2_a = '58%';      
      top_2_b = '3vh';
      left_2_b = '31%';
      top_3_5_a = '20vh';
      left_3_5_a = '70%';
      top_3_5_b = '20vh';
      left_3_5_b = '32%';
      top_3_a = '25vh';
      left_3_a = '32%';
      top_3_b = '40vh';
      left_3_b = '33%';
      top_4 = '45vh';
      left_4 = '33%';
    }



    element = 'bus-animation-1-a';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        app.dest_1_a = ((scrollY + 152) - offsetTop) * 1.2;
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_1_a) + 'px)', 'top': '0', 'left': '16%'});        

    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': '0', 'left': '16%'});      
    }

    element = 'bus-animation-1-b';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_1_b .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        app.dest_1_b = ((scrollY + 152) - offsetTop) * 1.5;
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_1_b) + 'px)', 'top': '1vh', 'left': '16%'});
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': '1vh', 'left': '16%'});      
    }

    element = 'bus-animation-1-5-a';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_1_5_a .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        app.dest_1_5_a = ((scrollY + 152) - offsetTop);
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_1_5_a) + 'px)', 'top': '20vh', 'left': '16%'});        

    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': '20vh', 'left': '16%'});      
    }

    element = 'bus-animation-1-5-b';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_1_5_b .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        app.dest_1_5_b = ((scrollY + 152) - offsetTop);
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_1_5_b) + 'px)', 'top': '20vh', 'left': '16%'});        
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': '20vh', 'left': '16%'});      
    }

    element = 'bus-animation-2-a';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_2_a .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        if (top_2_a == '20vh') {
          app.dest_2_a = ((scrollY + 152) - offsetTop);
          app.dest_2_a_X = app.dest_2_a;
        } else {
          app.dest_2_a = ((scrollY + 152) - offsetTop) * 1.2;
          app.dest_2_a_X = app.dest_2_a/7;
        } 
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_2_a) + 'px) translateX(' + parseInt(app.dest_2_a_X) + 'px)', 'top': top_2_a, 'left': left_2_a});        
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px) translateX(0px)', 'top': top_2_a, 'left': left_2_a});      
    }

    element = 'bus-animation-2-b';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_2_b .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        app.dest_2_b = ((scrollY + 152) - offsetTop) * 1.5;
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_2_b) + 'px)', 'top': top_2_b, 'left': left_2_b});        
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': top_2_b, 'left': left_2_b});      
    }

    element = 'bus-animation-3-5-a';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_3_5_a .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
          app.dest_3_5_a = ((scrollY + 152) - offsetTop) * 1.2;
          app.dest_3_5_a_X = app.dest_3_5_a/7;
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_3_5_a) + 'px) translateX(' + parseInt(app.dest_3_5_a_X) + 'px)', 'top': top_3_5_a, 'left': left_3_5_a});        
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px) translateX(0px)', 'top': top_3_5_a, 'left': left_3_5_a});      
    }

    element = 'bus-animation-3-5-b';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_3_5_b .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        app.dest_3_5_b = ((scrollY + 152) - offsetTop) * 1.5;
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_3_5_b) + 'px)', 'top': top_3_5_b, 'left': left_3_5_b});        
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': top_3_5_b, 'left': left_3_5_b});      
    }

    element = 'bus-animation-3-a';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_3_a .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
          app.dest_3_a = ((scrollY + 152) - offsetTop) * 1.2;
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_3_a) + 'px)', 'top': top_3_a, 'left': left_3_a});        
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': top_3_a, 'left': left_3_a});      
    }

    element = 'bus-animation-3-b';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_3_b .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        app.dest_3_b = ((scrollY + 152) - offsetTop) * 1.5;
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_3_b) + 'px)', 'top': top_3_b, 'left': left_3_b});        
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': top_3_b, 'left': left_3_b});      
    }

    element = 'bus-animation-4';
    offsetTop = $('#'+element).offset().top - 80;
    if (checkScroll(offsetTop)) {
      if (!$('#ride_map_4 .picture-book .picture-book-img-wrap').hasClass('picture-book-bg-bottom')) {
        app.dest_4 = ((scrollY + 152) - offsetTop) * 1.9;
      }
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(' + parseInt(app.dest_4) + 'px)', 'top': top_4, 'left': left_4});        
    } else {
      $('#'+element+'.bus-animation-wrapper .bus_temp_postion').css({'transform': 'translateY(0px)', 'top': top_4, 'left': left_4});      
    }

    function checkScroll(target) {
      if ((scrollY + 152) >= target) {
        return true;
      } else {
        return false;
      }
    }
 

}

app.createListeners = function () {
    // for chrome mobile
/*    document.addEventListener('touchmove',function(e){ 
      e.preventDefault();
    },true);*/
    
    if (($('body')).width() < 767) {
      // for now hide mini buses
      $('.bus-animation-wrapper').addClass('hidden');
    } else {
      $(window).scroll(app.scrollingInteractions);
      $(document).ready(app.scrollingInteractions);
    }

    if (route != "None") {
      setTimeout(function() {
        document.getElementById('report-card').scrollIntoView();
      }, 1000);
    } 


    if (($('body')).width() >= 767) {
      $('a.page-scroll').bind('click', function(event) {
          event.preventDefault();
          var $anchor = $(this);
          // if $anchor.attr('href') is #ride, then offset top to show title below the navbar (79px tall)
          var offset = 0;
          if ($anchor.attr('href') == '#ride') {
            offset = 84;
          }
          $('html, body').stop().animate({
              scrollTop: $($anchor.attr('href')).offset().top - offset
          }, 2000, 'easeInOutQuint');
      });
    }

    if (($('body')).width() >= 1149) {
      $('a.page-scroll').bind('click', function(event) {
          event.preventDefault();
          var $anchor = $(this);
          // if $anchor.attr('href') is #ride, then offset top to show title below the navbar (120px tall)
          var offset = 0;
          if ($anchor.attr('href') == '#ride') {
            offset = 125;
          }
          console.log(offset);
          $('html, body').stop().animate({
              scrollTop: $($anchor.attr('href')).offset().top - offset
          }, 2000, 'easeInOutQuint');
      });
    }

    $('#selectRoute').change(function() {
      // update map
      $('.reportCardRouteName').text($(this).val().replace('+', ' SBS'));
      if ($(this).val() == 'M60' || $(this).val() == 'M86') {
        $('.reportCardRouteName').text($(this).val() + ' SBS');
      }
      app.reportCardMap($(this).val());
      // update speed number and gauge
      app.updateSpeedGuageAndText($(this).val());
      // update bunching text
      app.updateBunching($(this).val());
      // update ridership text
      app.updateRidership($(this).val());
      // update share buttons
      app.updateShareButtons($(this).val());
    });
}

app.randomPersona = function () {
  var randInt = app.getRandomInt(1,3);
  if (randInt == 1) {
    $('#persona-image1').attr("src","/static/website/css/images/scene_start_grandma.png");
    $('#persona-image2').attr("src","/static/website/css/images/goal_grandma.png");
    $('#persona-1-a').attr("src","/static/website/css/images/scene_LATEright_grandma.png");
    $('#persona-1-5-a').attr("src","/static/website/css/images/loading_bad.png");
    $('#persona-1-5-a-2').attr("src","/static/website/css/images/handcountingchange_grandma.png");
    $('#persona-1-5-b').attr("src","/static/website/css/images/loading_good.png");
    $('#persona-1-5-b-2').attr("src","/static/website/css/images/contactlesscard_grandma.png");
    $('#persona-3-a').attr("src","/static/website/css/images/sad_grandma.png");
    $('#persona-3-b').attr("src","/static/website/css/images/happy_grandma.png");
    $('#persona-4').attr("src","/static/website/css/images/goal_grandma.png");
    $('#personaDescriptionText').text("Meet Sophia, a retiree taking the bus to her grandson's surprise birthday party, in her old neighborhood.");
    $('.personaName').text("Sophia");
    $('#personaPositiveThumbText').text("On the green maps below, follow along with Sophia as she has a smooth, reliable experience with an updated New York City bus system.");
    $('#personaNegativeThumbText').text("On the red maps below, follow Sophia's challenging experience with New York City's slow and unreliable bus system.");
    $('#persona-1-a-text').text("Sophia gets to the bus stop 10 minutes early, as she always does when she needs to be somewhere on time. But the bus doesn't arrive until nine minutes after it's scheduled. Sophia has been waiting for almost 20 minutes!");
    $('#persona-1-b-text').text("Sophia gets to the bus stop 10 minutes early, as she always does. The bus arrives right on time.");
    $('#persona-1-5-a-text').text("More time ticks away as people pay one by one. A man keeps putting his MetroCard into the slot backwards, holding up the line until Sophia corrects him.");
    $('#persona-1-5-b-text').text("Sophia takes her smartcard out of her purse and taps it at a reader at the front of the bus. A few people head to the back door, where there's another smartcard reader.");
    $('#persona-2-a-text').text("The bus is crowded. Someone gets up so Sophia can take a seat near the front of the bus, but it's stressful to have so many people standing around her. She's already worried about getting to the surprise party on time – and then the bus gets stuck in traffic.");
    $('#persona-2-b-text').text("Sophia finds an empty seat near the front of the bus and starts thinking about all of the family members who will be at the party. Even though traffic is heavy today, the bus has its own dedicated lane and keeps moving.");
    $('#persona-3-5-a-text').text("The bus slowly makes its way toward her old neighborhood, stopping almost every block. Then it makes a large loop on several streets rather than going directly down the main avenue. \"Why?!?\" Sophia wonders.");
    $('#persona-3-5-b-text').text("The bus makes its way toward her old neighborhood, stopping about every third block and running directly down the main avenue. The bus is making excellent time, Sophia thinks to herself.");
    $('#persona-3-a-text').text("Forty minutes after she began her trip, Sophia gets off the bus and hustles towards her son's house. She has probably missed the surprise and doesn't want to miss another moment of her grandson's celebration.");
    $('#persona-3-b-text').text("Twenty-five minutes after she began her trip, Sophia gets off the bus. She'll be right on time for the surprise party and even has a few extra minutes to take a walk past some of her favorite parts of the old neighborhood.");

  } else if (randInt == 2) {
    $('#persona-image1').attr("src","/static/website/css/images/scene_start_nurse.png");
    $('#persona-image2').attr("src","/static/website/css/images/goal_nurse.png");
    $('#persona-1-a').attr("src","/static/website/css/images/scene_LATEright_nurse.png");    
    $('#persona-1-5-a').attr("src","/static/website/css/images/loading_bad.png");
    $('#persona-1-5-a-2').attr("src","/static/website/css/images/handcountingchange_nurse.png");
    $('#persona-1-5-b').attr("src","/static/website/css/images/loading_good.png");
    $('#persona-1-5-b-2').attr("src","/static/website/css/images/contactlesscard_nurse.png");
    $('#persona-3-a').attr("src","/static/website/css/images/sad_nurse.png");
    $('#persona-3-b').attr("src","/static/website/css/images/happy_nurse.png");
    $('#persona-4').attr("src","/static/website/css/images/goal_nurse.png");
    $('#personaDescriptionText').text("Meet Daniel, a nurse waiting to catch the bus to get to work. He got up before sunrise to begin his commute, which involves an hour-long train ride and a transfer to the bus.");
    $('.personaName').text("Daniel");
    $('#personaPositiveThumbText').text("On the green maps below, follow along with Daniel as he has a smooth, reliable experience with an updated New York City bus system.");
    $('#personaNegativeThumbText').text("On the red maps below, follow Daniel's challenging experience with New York City's slow and unreliable bus system.");
    $('#persona-1-a-text').text("Phew, there's the bus. It's 8 minutes late, and more than a dozen people are at the stop waiting to board.");
    $('#persona-1-b-text').text("There it is! The bus arrives on schedule, a few minutes after Daniel reaches the bus stop. A handful of people are waiting at the stop, and it looks like there are enough seats on the bus for all of them.");
    $('#persona-1-5-a-text').text("The riders waiting to board cluster around the front door and people begin entering, dipping their MetroCards one by one. One person starts paying in coins but doesn't have enough, and has to dig in her purse to find another quarter.");
    $('#persona-1-5-b-text').text("The people waiting at the stop split into two groups, boarding at the front and back doors. Everyone pays by tapping a smartcard on a reader placed near the doors, so it takes just a few seconds for the whole group to board the bus.");
    $('#persona-2-a-text').text("Daniel finds a place to stand near the back door and checks his watch. He has twenty minutes to reach the hospital, which is about a mile and a half away. After a few blocks, the bus slows to a halt, stuck behind a line of cars and trucks.");
    $('#persona-2-b-text').text("Daniel finds a seat and begins reading the news as the bus pulls away. The bus glides to the next stop in its own dedicated lane, beating the traffic along the way.");
    $('#persona-3-5-a-text').text("Daniel checks the time nervously and thinks about the day that awaits him at work. The bus slowly makes its way toward the hospital, stopping at what feels like every other block. Then, the bus turns right and makes a large loop on several different streets, instead of traveling straight down the main road. \"Why?!?\" Daniel wonders.");
    $('#persona-3-5-b-text').text("The bus continues along a direct path toward the hospital, stopping at around every third block. Daniel is relieved to realize that he's on time so far.");
    $('#persona-3-a-text').text("22 minutes after boarding and nearly an hour and a half since beginning his commute, Daniel exits the bus and walks quickly toward the hospital. He'll be late.");
    $('#persona-3-b-text').text("Fifteen minutes after boarding and about an hour and ten minutes since beginning his commute, Daniel exits the bus. He has enough time to buy an egg-and-cheese sandwich from the bakery across the street from the hospital, which feels like a small victory.");

  } else {
    $('#persona-image1').attr("src","/static/website/css/images/scene_start_student.png");
    $('#persona-image2').attr("src","/static/website/css/images/goal_student.png");
    $('#persona-1-a').attr("src","/static/website/css/images/scene_LATEright_student.png");    
    $('#persona-1-5-a').attr("src","/static/website/css/images/loading_bad.png");
    $('#persona-1-5-a-2').attr("src","/static/website/css/images/handcountingchange_student.png");
    $('#persona-1-5-b').attr("src","/static/website/css/images/loading_good.png");
    $('#persona-1-5-b-2').attr("src","/static/website/css/images/contactlesscard_student.png");
   $('#persona-3-a').attr("src","/static/website/css/images/sad_student.png");
    $('#persona-3-b').attr("src","/static/website/css/images/happy_student.png");
    $('#persona-4').attr("src","/static/website/css/images/goal_student.png");
    $('.personaName').text("Olivia");
    $('#personaDescriptionText').text("Meet Olivia, a student on her way to take her final exams. She's waiting for the bus.");
    $('#personaPositiveThumbText').text("On the green maps below, follow along with Olivia as she has a smooth, reliable experience with an updated New York City bus system.");
    $('#personaNegativeThumbText').text("On the red maps below, follow Olivia's challenging experience with New York City's slow and unreliable bus system.");
    $('#persona-1-a-text').text("Olivia's bus is already 10 minutes late. Phew, there it is. The bus pulls up and it's pretty full. There are a bunch of other people at her stop waiting to board.");
    $('#persona-1-b-text').text("There it is! The bus arrives on schedule, a few minutes after Olivia reached the bus stop. There are seats remaining. ");
    $('#persona-1-5-a-text').text("The group clusters around the front door and people begin entering, dipping their MetroCards one by one. Now someone is paying in coins. Clink, clink, click, at least 20 coins!");
    $('#persona-1-5-b-text').text("The handful of people waiting at the stop with Olivia split into two groups, a few people board through the front door and a few board through the back door. This takes just seconds as everyone pays by tapping a smartcard on a reader placed near the door.");
    $('#persona-2-a-text').text("Olivia finds a seat in the back and begins reviewing her exam notes as the bus pulls away. After a few blocks, the bus slows to a halt. Ugh, it's now stuck in traffic.");
    $('#persona-2-b-text').text("Olivia finds a seat and begins reviewing her exam notes as the bus pulls away. The bus glides to the next stop in its very own dedicated lane.");
    $('#persona-3-5-a-text').text("Olivia checks the time nervously and tries to focus on her notes. The bus slowly makes its way toward the subway, stopping at what feels like every other block. Then, they wind through a part of the route where the bus makes a loop around a few blocks rather than traveling straight down the main road. \"Why?!?\" Olivia wonders.");
    $('#persona-3-5-b-text').text("The bus makes its way toward the subway, stopping at around every third block. It continues along a direct path to the subway.");
    $('#persona-3-a-text').text("20 minutes after boarding and 30 minutes after beginning her wait at the stop, Olivia makes it to the subway. It's 7:44AM, meaning she has about 15 minutes to travel three stops and walk a block to make it to her exam on time. She crosses her fingers and enters the station. ");
    $('#persona-3-b-text').text("15 minutes after boarding and 18 minutes after beginning her wait at the stop, Olivia makes it to the subway. It's 7:32AM, meaning she has nearly 30 minutes to travel three stops and walk a block to make it to her exam on time. She'll probably have extra time to get settled before her exams begin.");
    
  }
}

app.getRandomInt = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.createReportCardDropdowns = function (route_id) {

  // get data from carto to use in report card
  app.sqlclient.execute("SELECT DISTINCT route_id FROM mta_nyct_bus_routes WHERE route_id <> 'Bronx Average' AND route_id <> 'Brooklyn Average' AND route_id <> 'Manhattan Average' AND route_id <> 'Queens Average' AND route_id <> 'Staten Island Average' ORDER BY route_id")
  .done(function(data) {
    // extract results to an array for sorting
    routeIDs = [];
    for (var i = data.rows.length - 1; i >= 0; i--) {
      routeIDs.push(data.rows[i].route_id);
    }
    routeIDs.sort(naturalCompare);
    console.log(routeIDs);

    function naturalCompare(a, b) {
        var ax = [], bx = [];
        a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
        b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
        while(ax.length && bx.length) {
            var an = ax.shift();
            var bn = bx.shift();
            var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
            if(nn) return nn;
        }
        return ax.length - bx.length;
    }

    // loop through response to populate dropdown
    for (var i = 0; i < routeIDs.length; i++) {
      var option = $('<option/>').attr({ 'value': routeIDs[i] }).text(routeIDs[i].replace('+', ' SBS'));
      // ensure M60 and M86 are tagged as SBS
      if (routeIDs[i] == 'M60' || routeIDs[i] == 'M86') {
        option = $('<option/>').attr({ 'value': routeIDs[i] + '+' }).text(routeIDs[i] + ' SBS');
      }
      if (routeIDs[i].charAt(0) === 'B' && routeIDs[i].charAt(1) === 'X' && routeIDs[i].charAt(2) === 'M' ) {
        $('#dropdownBXM').append(option);
      } else if (routeIDs[i].charAt(0) === 'B' && routeIDs[i].charAt(1) === 'X') {
        $('#dropdownBX').append(option);
      } else if (routeIDs[i].charAt(0) === 'B' && routeIDs[i].charAt(1) === 'M') {
        $('#dropdownBM').append(option);
      } else if (routeIDs[i].charAt(0) === 'B') {
        $('#dropdownB').append(option);
      } else if (routeIDs[i].charAt(0) === 'Q' && routeIDs[i].charAt(1) === 'M') {
        $('#dropdownQM').append(option);
      } else if (routeIDs[i].charAt(0) === 'Q') {
        $('#dropdownQ').append(option);
      } else if (routeIDs[i].charAt(0) === 'M') {
        $('#dropdownM').append(option);
      } else if (routeIDs[i].charAt(0) === 'S') {
        // skip S81, S86, S91, S92, S94, S96, S98
        if (routeIDs[i] == 'S81' || routeIDs[i] == 'S86' ||  routeIDs[i] == 'S91' || routeIDs[i] == 'S92' || routeIDs[i] == 'S94' || routeIDs[i] == 'S96' || routeIDs[i] == 'S98') {
          //skip
        } else {
          $('#dropdownS').append(option);          
        }
      } else {
        $('#dropdownX').append(option);
      }

    }

    // when done create select2 menu
    // if mobile, skip setting up select 2
    if (($('body')).width() < 767) {
      $("#selectRoute").val(route_id);
    } else {
      app.selectRouteMenu = $("#selectRoute").select2();

      app.selectRouteMenu.on("select2:open", function (e) { 
        // add type bx placeholder text
        $(".select2-search__field").attr("placeholder", "Start typing a bus route here to search.");
      });

      // set first route 
      app.selectRouteMenu.val(route_id).trigger("change");

    }

    
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
}

app.reportCardMap = function (route_id) {
  // make a static map using CARTO Static API
  // first get bounds for the map
  app.sqlclient.getBounds("SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'")
    .done(function(bounds) {
      app.bounds = bounds;
    });

  /**** If we want to try adding labels to text layers use somethign like the following cartocss
  * text-name:[boro_name];text-face-name:'DejaVu Sans Book';text-size:50;text-fill: #6F808D;text-halo-radius: 1;text-halo-fill: rgba(255, 255, 255, 0.75);text-transform:uppercase;
  ****/ 
  var mapconfig = {
    "layers": [
/*      {
        "type": "mapnik",
        "options": {
          "sql": "SELECT * FROM nyc_borough_boundaries",
          "cartocss": "#layer {line-width: 1;line-color: #333;line-opacity: 0.9;polygon-fill: #f5f5f3;polygon-opacity:1;} ",
          "cartocss_version": "2.1.1"
        }
      },*/
      {
        "type": "http",
        "options": {
          "urlTemplate": "http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
          "subdomains": [
            "a",
            "b",
            "c"
          ]
        }
      },
      {
        "type": "mapnik",
        "options": {
          "sql": "SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'",
          "cartocss": "#layer {line-width: 5;line-color: #31708f;line-opacity: 1;} ",
          "cartocss_version": "2.1.1"
        }
      },
    ]
  }

  $.ajax({
    crossOrigin: true,
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    url: 'https://'+app.username+'.carto.com/api/v1/map',
    data: JSON.stringify(mapconfig),
    success: function(data) {
      // url of the form /api/v1/map/static/bbox/{token}/{bbox}/{width}/{height}.{format}
      // https://carto.com/docs/carto-engine/maps-api/static-maps-api/#bounding-box
      var url = 'https://'+app.username+'.carto.com/api/v1/map/static/bbox/'+data.layergroupid+'/'+app.bounds[1][1]+','+app.bounds[1][0]+','+app.bounds[0][1]+','+app.bounds[0][0]+'/792/1224.png';
      // get map image
      $('#route-map').html('<img class="img-responsive route-map pull-right" src="'+url+'" />');
    }

  });


/*  app.tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{ attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });  

  app.map = L.map('route-map', { scrollWheelZoom: false, center: [40.7127837, -74.0059413], zoom: 10 });  

  app.map.addLayer(app.tiles);

  cartodb.createLayer(app.map, {
    user_name: app.username,
    type: 'cartodb',
    sublayers: [{
      sql: "SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'",
      cartocss: '#layer {line-width: 3;line-color: #31708f;line-opacity: 1;}'
    }]
  })
  .addTo(app.map) // add the layer to our map which already contains 1 sublayer
  .done(function(layer) {
    app.sqlclient.getBounds("SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'").done(function(bounds) {
      app.map.fitBounds(bounds)
    });

  });*/

}

app.initialDataBounds = function (route_id) {
  // select min and max values for speed dataset
  // min
  app.sqlclient.execute("SELECT min(speed), max(speed) FROM table_5150808763")
  .done(function(data) {
    //app.minSpeed = data.rows[0].min;
    app.minSpeed = 0;
    app.maxSpeed = data.rows[0].max;
    // set color domain for text colors

    //app.speedTextColorScale.domain([0,app.maxSpeed/10,app.maxSpeed/9,app.maxSpeed/8,app.maxSpeed/7,app.maxSpeed/6,app.maxSpeed/5,app.maxSpeed/4,app.maxSpeed/3,app.maxSpeed/2,app.maxSpeed]);
    //app.speedTextColorScale.domain([0,2,4,6,8,10,12,14,16,18]);
    app.speedTextColorScale.domain([app.minSpeed, app.maxSpeed]);
    // load speed data on the initially selected route
    loadRouteSpeed();
  })
  .error(function(errors) {
    console.log("errors:" + errors);
  });

  function loadRouteSpeed() {
    app.sqlclient.execute("SELECT speed FROM table_5150808763 WHERE route_id = '"+ route_id +"'")
    .done(function(data) {
      app.routeSpeed = data.rows[0].speed.toFixed(1);
      app.initializeSpeedGauge();
      // set initial text value and color
      $('#speedNumber').text(app.routeSpeed);
      $('#speedNumber').css( "color", app.speedTextColorScale(app.routeSpeed) );
    })
    .error(function(errors) {
      // errors contains a list of errors
      console.log("errors:" + errors);
    });   
  }

  // select min and max numbers for ridership change
  app.sqlclient.execute("SELECT min(prop_change_2010_2015), max(prop_change_2010_2015) FROM mta_nyct_bus_avg_weekday_ridership")
  .done(function(data) {
    app.minRidershipChange = data.rows[0].min * 100;
    app.maxRidershipChange = data.rows[0].max * 100;
    // set color domain for text colors
    app.ridershipChangeTextColorScale.domain([app.minRidershipChange, app.maxRidershipChange]);
    // load ridership mins and maxes, then update ridership text
    loadRidershipBounds(); 
  })
  .error(function(errors) {
    console.log("errors:" + errors);
  }); 

  function loadRidershipBounds () {
    // select min and max numbers for ridership data
    app.sqlclient.execute("SELECT min(year_2015), max(year_2015) FROM mta_nyct_bus_avg_weekday_ridership")
    .done(function(data) {
      app.minRidership = data.rows[0].min;
      app.maxRidership = data.rows[0].max;
      // set color domain for text colors
      app.ridershipTextColorScale.domain([app.minRidership, app.maxRidership]);
      // update riderhip figures for this route
      app.updateRidership(route_id);
    })
    .error(function(errors) {
      console.log("errors:" + errors);
    }); 
  }

  // select min and max numbers for ridership data
  app.sqlclient.execute("SELECT min(prop_bunched), max(prop_bunched) FROM bunching_10_2015_05_2016")
  .done(function(data) {
    app.minPropBunched = data.rows[0].min * 100;
    app.maxPropBunched = data.rows[0].max * 100;
    // set color domain for text colors
    app.bunchTextColorScale.domain([app.minPropBunched, app.maxPropBunched]);
    // set up margin and color scales for each bus
    app.bunchMarginColorScales();
    // update bunching text and graphic for this route
    app.updateBunching(route_id);
  })
  .error(function(errors) {
    console.log("errors:" + errors);
  }); 

}

app.bunchMarginColorScales = function () {
  // calculate 5ths
  app.oneFifthPropBunched = (app.maxPropBunched - app.minPropBunched) / 5;
  app.firstFifth = app.minPropBunched + app.oneFifthPropBunched;
  app.secondFifth = app.minPropBunched + (app.oneFifthPropBunched * 2);
  app.thirdFifth = app.minPropBunched + (app.oneFifthPropBunched * 3);
  app.fourthFifth = app.minPropBunched + (app.oneFifthPropBunched * 4);
  app.fifthFifth = app.minPropBunched + (app.oneFifthPropBunched * 5);

/* Changing to one color scale for all buses
  app.bus5ColorScale.domain([app.minPropBunched, app.firstFifth]);
  app.bus4ColorScale.domain([app.firstFifth, app.secondFifth]);
  app.bus3ColorScale.domain([app.secondFifth, app.thirdFifth]);
  app.bus2ColorScale.domain([app.thirdFifth, app.fourthFifth]);
  app.bus1ColorScale.domain([app.fourthFifth, app.fifthFifth]);
*/

  app.bus5ColorScale.domain([app.minPropBunched, app.maxPropBunched]);
  app.bus4ColorScale.domain([app.minPropBunched, app.maxPropBunched]);
  app.bus3ColorScale.domain([app.minPropBunched, app.maxPropBunched]);
  app.bus2ColorScale.domain([app.minPropBunched, app.maxPropBunched]);
  app.bus1ColorScale.domain([app.minPropBunched, app.maxPropBunched]);


  app.bus5MarginScale.domain([app.minPropBunched, app.firstFifth]);
  app.bus4MarginScale.domain([app.firstFifth, app.secondFifth]);
  app.bus3MarginScale.domain([app.secondFifth, app.thirdFifth]);
  app.bus2MarginScale.domain([app.thirdFifth, app.fourthFifth]);
  app.bus1MarginScale.domain([app.fourthFifth, app.fifthFifth]);

}

app.updateBunching = function(route_id) {
    app.sqlclient.execute("SELECT * FROM bunching_10_2015_05_2016 WHERE route_id = '"+ route_id +"'")
    .done(function(data) {
      if (typeof data.rows[0] === 'undefined') {
        app.propBunched = 'N/A';
        app.updateBunchingText();
        app.updateBunchingGraphic();        
      } else {
        app.propBunched = data.rows[0].prop_bunched * 100;
        app.updateBunchingText();
        app.updateBunchingGraphic();        
      }
    })
    .error(function(errors) {
      // errors contains a list of errors
      console.log("errors:" + errors);
    }); 

}

app.updateBunchingText = function () {
  if (app.propBunched == 'N/A') {
    $('#bunchedNumber').text('N/A');
    $('#bunchedNumber').css( "color", app.bunchTextColorScale(0) );
  } else {
    $({countNum: $('#bunchedNumber').text().replace('%','')}).animate({countNum: app.propBunched}, {
      duration: 1000,
      easing:'linear',
      step: function() {
        if (this.countNum) {
          $('#bunchedNumber').text(parseFloat(this.countNum).toFixed(1) + '%');
          $('#bunchedNumber').css( "color", app.bunchTextColorScale(this.countNum) );
        } else {
          $('#bunchedNumber').text('0%');
        }
      },
      complete: function() {
        $('#bunchedNumber').text(parseFloat(this.countNum).toFixed(1) + '%');
        $('#bunchedNumber').css( "color", app.bunchTextColorScale(this.countNum) );
      }
    });    
  }

}

/* 
  app.firstFifth = app.minPropBunched + app.oneFifthPropBunched;
  app.secondFifth = app.minPropBunched + (app.oneFifthPropBunched * 2);
  app.thirdFifth = app.minPropBunched + (app.oneFifthPropBunched * 3);
  app.fourthFifth = app.minPropBunched + (app.oneFifthPropBunched * 4);
  app.fifthFifth = app.minPropBunched + (app.oneFifthPropBunched * 5);
*/
app.updateBunchingGraphic = function () {
  if (app.propBunched <= app.firstFifth) {
    // update the margin/color for fifth bus and set the other buses to their minimum
    var color5 = app.bus5ColorScale(app.propBunched);
    var margin5 = app.bus5MarginScale(app.propBunched);

    var color4 = app.bus4ColorScale(app.propBunched);
    var margin4 = app.bus4MarginScale(app.firstFifth);
    var color3 = app.bus3ColorScale(app.propBunched);
    var margin3 = app.bus3MarginScale(app.secondFifth);
    var color2 = app.bus2ColorScale(app.propBunched);
    var margin2 = app.bus2MarginScale(app.thirdFifth);
    var color1 = app.bus1ColorScale(app.propBunched);
    var margin1 = app.bus1MarginScale(app.fourthFifth);
  } else if (app.propBunched <= app.secondFifth) {
    var color5 = app.bus5ColorScale(app.propBunched);
    var margin5 = app.bus5MarginScale(app.firstFifth);

    var color4 = app.bus4ColorScale(app.propBunched);
    var margin4 = app.bus4MarginScale(app.propBunched);

    var color3 = app.bus3ColorScale(app.propBunched);
    var margin3 = app.bus3MarginScale(app.secondFifth);
    var color2 = app.bus2ColorScale(app.propBunched);
    var margin2 = app.bus2MarginScale(app.thirdFifth);
    var color1 = app.bus1ColorScale(app.propBunched);
    var margin1 = app.bus1MarginScale(app.fourthFifth);
  } else if (app.propBunched <= app.thirdFifth) {
    var color5 = app.bus5ColorScale(app.propBunched);
    var margin5 = app.bus5MarginScale(app.firstFifth);
    var color4 = app.bus4ColorScale(app.propBunched);
    var margin4 = app.bus4MarginScale(app.secondFifth);

    var color3 = app.bus3ColorScale(app.propBunched);
    var margin3 = app.bus3MarginScale(app.propBunched);

    var color2 = app.bus2ColorScale(app.propBunched);
    var margin2 = app.bus2MarginScale(app.thirdFifth);
    var color1 = app.bus1ColorScale(app.propBunched);
    var margin1 = app.bus1MarginScale(app.fourthFifth);
  } else if (app.propBunched <= app.fourthFifth) {
    var color5 = app.bus5ColorScale(app.propBunched);
    var margin5 = app.bus5MarginScale(app.firstFifth);
    var color4 = app.bus4ColorScale(app.propBunched);
    var margin4 = app.bus4MarginScale(app.secondFifth);
    var color3 = app.bus3ColorScale(app.propBunched);
    var margin3 = app.bus3MarginScale(app.thirdFifth);

    var color2 = app.bus2ColorScale(app.propBunched);
    var margin2 = app.bus2MarginScale(app.propBunched);

    var color1 = app.bus1ColorScale(app.propBunched);
    var margin1 = app.bus1MarginScale(app.fourthFifth);
  } else {
    var color5 = app.bus5ColorScale(app.propBunched);
    var margin5 = app.bus5MarginScale(app.firstFifth);
    var color4 = app.bus4ColorScale(app.propBunched);
    var margin4 = app.bus4MarginScale(app.secondFifth);
    var color3 = app.bus3ColorScale(app.propBunched);
    var margin3 = app.bus3MarginScale(app.thirdFifth);
    var color2 = app.bus2ColorScale(app.propBunched);
    var margin2 = app.bus2MarginScale(app.fourthFifth);

    var color1 = app.bus1ColorScale(app.propBunched);
    var margin1 = app.bus1MarginScale(app.propBunched);    
  }
  // apply colors and margins
  d3.select("#useBus5").transition().duration(1000).style("fill", color5);
  d3.select("#useBus4").transition().duration(1000).style("fill", color4);
  d3.select("#useBus3").transition().duration(1000).style("fill", color3);
  d3.select("#useBus2").transition().duration(1000).style("fill", color2);
  d3.select("#useBus1").transition().duration(1000).style("fill", color1);

  margin5 = margin5 + 'px';
  margin4 = margin4 + 'px';
  margin3 = margin3 + 'px';
  margin2 = margin2 + 'px';
  //margin1 = margin1 + 'px';
  margin1 = '0px';

  d3.select("#svgBus5").transition().duration(1000).style("margin-left", margin5);
  d3.select("#svgBus4").transition().duration(1000).style("margin-left", margin4);
  d3.select("#svgBus3").transition().duration(1000).style("margin-left", margin3);
  d3.select("#svgBus2").transition().duration(1000).style("margin-left", margin2);
  d3.select("#svgBus1").transition().duration(1000).style("margin-left", margin1);

}

app.updateRidership = function(route_id) {
    app.sqlclient.execute("SELECT * FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id = '"+ route_id +"'")
    .done(function(data) {
      if (typeof data.rows[0] === 'undefined') {
        app.ridership ='N/A';
        app.ridershipGroupRank = 'N/A';
        app.ridershipChangeProp = 'N/A';
        app.ridershipGroupName = 'N/A';
        app.ridershipNotes = ''
        app.updateRidershipText();
        app.updateRidershipRank();
        app.updateRidershipChange();
      } else {
        app.ridership = data.rows[0].year_2015;
        app.ridershipGroupRank = data.rows[0].group_rank_2015;
        app.ridershipChangeProp = data.rows[0].prop_change_2010_2015 * 100;
        app.ridershipGroupName = data.rows[0].grouping;
        app.ridershipNotes = data.rows[0].note;
        app.updateRidershipText();
        app.updateRidershipRank();
        app.updateRidershipChange();
      }
    })
    .error(function(errors) {
      // errors contains a list of errors
      console.log("errors:" + errors);
    }); 

}

app.updateRidershipText = function () {
  if (app.ridership == 'N/A') {
    // no riderhip data
    $('#ridershipData').addClass('hidden');
    $('#noRidershipData').removeClass('hidden');
    $('#ridershipNumber').text('N/A');
    $('#ridershipNumber').css( "color", app.ridershipTextColorScale(0) );
  } else {
    $('#ridershipData').removeClass('hidden');
    $('#noRidershipData').addClass('hidden');
    $({countNum: $('#ridershipNumber').text().replace(',','')}).animate({countNum: app.ridership}, {
      duration: 1000,
      easing:'linear',
      step: function() {
        if (this.countNum) {
          $('#ridershipNumber').text(app.numberWithCommas(parseInt(this.countNum)));
          $('#ridershipNumber').css( "color", app.ridershipTextColorScale(this.countNum) );
        } else {
          $('#ridershipNumber').text('0');
        }
      },
      complete: function() {
        $('#ridershipNumber').text(app.numberWithCommas(parseInt(this.countNum)));
        $('#ridershipNumber').css( "color", app.ridershipTextColorScale(this.countNum) );
      }
    });
  }
  // also update the riderhsip notes field
  $('#ridershipNotes').text(app.ridershipNotes);
}

app.updateRidershipRank = function () {
  if (app.ridershipGroupRank == 'N/A') {
    $('#ridershipMaxRank').text('N/A');
    update();
  } else {
    // select max ranking for the group
    app.sqlclient.execute("SELECT max(group_rank_2015) FROM mta_nyct_bus_avg_weekday_ridership WHERE grouping = '"+ app.ridershipGroupName +"'")
    .done(function(data) {
      app.maxRidershipGroup = data.rows[0].max;
      $('#ridershipMaxRank').text(parseInt(app.maxRidershipGroup));
      // set color domain for text colors
      app.ridershipRankingTextColorScale.domain([1, app.maxRidershipGroup]);
      update();
    })
    .error(function(errors) {
      console.log("errors:" + errors);
    }); 
  }

  function update() {
    if (app.ridershipGroupRank == 'N/A') {
      $('#ridershipRanking').text('N/A');
      $('#ridershipRanking').css( "color", app.ridershipRankingTextColorScale(0) );
    } else {
      $({countNum: parseInt($('#ridershipRanking').text())}).animate({countNum: app.ridershipGroupRank}, {
        duration: 1000,
        easing:'linear',
        step: function() {
          if (this.countNum) {
            $('#ridershipRanking').text(app.ordinal_suffix_of(parseInt(this.countNum)));
            $('#ridershipRanking').css( "color", app.ridershipRankingTextColorScale(this.countNum) );
          } else {
            $('#ridershipRanking').text('1');
          }
        },
        complete: function() {
          $('#ridershipRanking').text(app.ordinal_suffix_of(parseInt(this.countNum)));
          $('#ridershipRanking').css( "color", app.ridershipRankingTextColorScale(this.countNum) );
        }
      }); 
    }  
  }

  // update the group name
  $('#ridershipGroup').text(app.ridershipGroupName);

}

app.updateRidershipChange = function () {
  // instead of using the app.ridershipChangeTextColorScale, just show green if growth in ridership and red if loss in ridership
  if (app.ridershipChangeProp == 'N/A') {
    $('#ridershipChange').text('N/A');
    $('#ridershipChange').css( "color", '#3c763d' );
  } else {
    $({countNum: parseFloat($('#ridershipChange').text())}).animate({countNum: app.ridershipChangeProp}, {
      duration: 1000,
      easing:'linear',
      step: function() {
        if (this.countNum) {
          if (this.countNum >= 0) {
            $('#ridershipChange').text(parseFloat(this.countNum).toFixed(1) + '% increase');
            $('#ridershipChange').css( "color", '#3c763d' );
          } else {
            $('#ridershipChange').text(Math.abs(parseFloat(this.countNum)).toFixed(1) + '% decrease');
            $('#ridershipChange').css( "color", '#a94442' );          
          }
        } else {
          $('#ridershipChange').text('0% increase');
        }
      },
      complete: function() {
        if (this.countNum >= 0) {
          $('#ridershipChange').text(parseFloat(this.countNum).toFixed(1) + '% increase');
          $('#ridershipChange').css( "color", '#3c763d' );
        } else {
          $('#ridershipChange').text(Math.abs(parseFloat(this.countNum)).toFixed(1) + '% decrease');          
          $('#ridershipChange').css( "color", '#a94442' );          
        }
      }
    });
  }
}

app.initializeSpeedGauge = function() {
    // set up report card speed gauge
  app.speedGaugeObject = app.speedGauge('#speed-gauge', {
    size: 200,
    clipWidth: 200,
    clipHeight: 110,
    ringWidth: 60,
    minValue: 0,
    maxValue: 16,
    transitionMs: 2000,
    majorTicks: 500,
    pointerHeadLengthPercent: 0.85,
  });
  app.speedGaugeObject.render();
  // add initial speed object
  app.speedGaugeObject.update(app.routeSpeed);
  // update speed number
  $('#speedNumber').text(app.routeSpeed);
}

app.updateSpeedGuageAndText = function(route_id) {
  app.sqlclient.execute("SELECT speed FROM table_5150808763 WHERE route_id = '"+ route_id +"'")
  .done(function(data) {
    if (typeof data.rows[0] === 'undefined') {
      app.updateSpeedText('N/A');
      app.speedGaugeObject.update(0);
    } else {
      app.routeSpeed = data.rows[0].speed.toFixed(1);
      // update speed number and gauge
      app.updateSpeedText(app.routeSpeed);
      if (typeof app.speedGaugeObject !== 'undefined') {
        app.speedGaugeObject.update(app.routeSpeed);
      }       
    }
  
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  }); 
}

app.updateSpeedText = function (newSpeed) {
  if (newSpeed == 'N/A') {
    $('#speedNumber').text(newSpeed);
    $('#speedNumber').css( "color", app.speedTextColorScale(0) );
  } else {
    $({countNum: $('#speedNumber').text()}).animate({countNum: newSpeed}, {
      duration: 1000,
      easing:'linear',
      step: function() {
        if (this.countNum) {
          $('#speedNumber').text(parseFloat(this.countNum).toFixed(1));
          $('#speedNumber').css( "color", app.speedTextColorScale(this.countNum) );
        } else {
          $('#speedNumber').text('0');
        }
      },
      complete: function() {
        $('#speedNumber').text(parseFloat(this.countNum).toFixed(1));
        $('#speedNumber').css( "color", app.speedTextColorScale(this.countNum) );
      }
    });    
  }

}

app.speedGauge = function (container, configuration) {
  var that = {};
  var config = {
    size              : 200,
    clipWidth         : 200,
    clipHeight        : 110,
    ringInset         : 20,
    ringWidth         : 20,
    
    pointerWidth        : 10,
    pointerTailLength     : 5,
    pointerHeadLengthPercent  : 0.9,
    
    minValue          : 0,
    maxValue          : 10,
    
    minAngle          : -90,
    maxAngle          : 90,
    
    transitionMs        : 1000,
    
    majorTicks          : 5,
    labelFormat         : d3.format(',g'),
    labelInset          : 10,
    
    arcColorFn          : d3.interpolateHsl(d3.rgb('#FF4000'), d3.rgb('#5BCF59'))
  };
  var range = undefined;
  var r = undefined;
  var pointerHeadLength = undefined;
  var value = 0;
  
  var svg = undefined;
  var arc = undefined;
  var arcLabels = undefined;
  var scale = undefined;
  var ticks = undefined;
  var tickData = undefined;
  var pointer = undefined;

  var donut = d3.layout.pie();
  
  function deg2rad(deg) {
    return deg * Math.PI / 180;
  }
  
  function newAngle(d) {
    var ratio = scale(d);
    var newAngle = config.minAngle + (ratio * range);
    return newAngle;
  }
  
  function configure(configuration) {
    var prop = undefined;
    for ( prop in configuration ) {
      config[prop] = configuration[prop];
    }
    
    range = config.maxAngle - config.minAngle;
    r = config.size / 2;
    pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

    // a linear scale that maps domain values to a percent from 0..1
    scale = d3.scale.linear()
      .range([0,1])
      .domain([config.minValue, config.maxValue]);
      
    ticks = scale.ticks(config.majorTicks);
    tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks;});
    
    arc = d3.svg.arc()
      .innerRadius(r - config.ringWidth - config.ringInset)
      .outerRadius(r - config.ringInset)
      .startAngle(function(d, i) {
        var ratio = d * i;
        return deg2rad(config.minAngle + (ratio * range));
      })
      .endAngle(function(d, i) {
        var ratio = d * (i+1);
        return deg2rad(config.minAngle + (ratio * range));
      });

    // arcs for text labels
    arcLabels = d3.svg.arc()
      .innerRadius(r - config.ringWidth + 10)
      .outerRadius(r - config.ringInset + 10)
      .startAngle(-90 * (Math.PI/180))
      .endAngle(90 * (Math.PI/180));

  }
  that.configure = configure;
  
  function centerTranslation() {
    return 'translate('+r +','+ r +')';
  }
  
  function isRendered() {
    return (svg !== undefined);
  }
  that.isRendered = isRendered;
  
  function render(newValue) {
    svg = d3.select(container)
      .append('svg:svg')
        .attr('class', 'gauge')
        .attr('width', config.clipWidth)
        .attr('height', config.clipHeight);
    
    var centerTx = centerTranslation();
    
    var arcs = svg.append('g')
        .attr('class', 'arc')
        .attr('transform', centerTx);
  
    arcs.selectAll('path')
        .data(tickData)
      .enter().append('path')
        .attr('fill', function(d, i) {
          return config.arcColorFn(d * i);
        })
        .attr('d', arc);

    // arc for labels
    var arcText = svg.append('g')
        .attr('transform', centerTx);
    arcText.append("path")
        .attr("id", "curve")
        .attr("d", arcLabels)
        .attr('fill', 'none');
    
    var avgSpeed = config.maxValue/2;
    ticks = [1, 3, 5, 7, 9, 11, 13, 15]
    var lg = svg.append('g')
        .attr('class', 'label')
        .attr('transform', centerTx);
    lg.selectAll('text')
        .data(ticks)
      .enter().append('text')
        .attr('transform', function(d) {
          var ratio = scale(d);
          var newAngle = config.minAngle + (ratio * range);
          return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
        })
        .text(config.labelFormat);
        

    var lineData = [ [config.pointerWidth / 2, 0], 
            [0, -pointerHeadLength],
            [-(config.pointerWidth / 2), 0],
            [0, config.pointerTailLength],
            [config.pointerWidth / 2, 0] ];
    var pointerLine = d3.svg.line().interpolate('monotone');
    var pg = svg.append('g').data([lineData])
        .attr('class', 'pointer')
        .attr('transform', centerTx);
        
    pointer = pg.append('path')
      .attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
      .attr('transform', 'rotate(' +config.minAngle +')');
      
    update(newValue === undefined ? 0 : newValue);
  }
  that.render = render;
  
  function update(newValue, newConfiguration) {
    if ( newConfiguration  !== undefined) {
      configure(newConfiguration);
    }
    var ratio = scale(newValue);
    var newAngle = config.minAngle + (ratio * range);
    pointer.transition()
      .duration(config.transitionMs)
      .ease('elastic')
      .attr('transform', 'rotate(' +newAngle +')');
  }
  that.update = update;

  configure(configuration);
  
  return that;
}


// retired
/*app.delayBar = function () {
  var value = parseInt(113);
  var valuePrint = value;

  //create svg for most recent sample
  var scale = d3.scale.linear()
          .domain([0, 400])
          .range([0, 200]);

      var firstPoint = scale(value) + 10;
      var secondPoint = scale(value) + 20;
      var thirdPoint = scale(value) + 15;
      var delayAnchor = scale(275) + 15;
      var scheduleAnchor = scale(75) + 15;

      var points =  firstPoint + ",15 " + secondPoint + ",15 " + thirdPoint + ", 25";

  var delayBar = d3.select("#delay-bar")
    .append('svg')
    .attr('width', 200)
    .attr('height', 60);

  delayBar.append('rect')
    .attr('width', scale(400))
    .attr('height', 6)
    .attr('x', 0)
    .attr('y', 20)
    .attr('style', 'fill: #FF4000');

  delayBar.append('rect')
    .attr('width', scale(200))
    .attr('height', 6)
    .attr('x', 0)
    .attr('y', 20)
    .attr('style', 'fill: #5BCF59');

  delayBar.append('polygon')
    .attr('points', points)
    .attr('style', 'fill: #545454');

  delayBar.append("text")
    .attr("text-anchor", "middle")
    .attr("dx", scheduleAnchor)
    .attr("dy", 40)
    .attr('style', "font-size: 14px;")
    .text('Schedule');

  delayBar.append("text")
    .attr("text-anchor", "middle")
    .attr("dx", delayAnchor)
    .attr("dy", 40)
    .attr('style', "font-size: 14px;")
    .text('Delay');     
}*/

app.bunchingBuses = function () { 
  app.bus1 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus1")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus1.append("use")
    .attr("id", "useBus1")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );

  app.bus2 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus2")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus2.append("use")
    .attr("id", "useBus2")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );

  app.bus3 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus3")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus3.append("use")
    .attr("id", "useBus3")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );

  app.bus4 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus4")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus4.append("use")
    .attr("id", "useBus4")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );

  app.bus5 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus5")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus5.append("use")
    .attr("id", "useBus5")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );
}


// picture book scrolling code
app.pictureBook = function () {

    var windowAspectRatio = window.innerWidth/window.innerHeight,
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/.test(navigator.userAgent);

    // console.log(windowAspectRatio);
    var scrollYAtScan = 0,
        // screenMeasure = windowAspectRatio < 0.7 && isMobile ? 0.8 : 0.5; // measurement point for page progress - 0.5 = vertical center of the window.
        screenMeasure = windowAspectRatio <= 0.9 || window.innerWidth < 855 ? 0.7 : 0.5; // measurement point for page progress - 0.5 = vertical center of the window.

    function getScrollY() {
      return scrollY;
    }

    this.initBook = function (book) {
      // if we nee to run an initialize funciton on a book, this a place to do it.
      return
    }

    this.ready = function (book) {
      // another function for setting up animations -- will be useful for animating the bus along the route
      if (book.slug === 'pick') {}
    }

    this.update = function (activeBook) {
      var b = activeBook;
      if (b.slug === 'pick') {
        // create trasition
      }
    }

    this.books = [].map.call(document.querySelectorAll(".picture-book"), function(d) {
      return {
        node: d,
        slug: d.getAttribute("data-slug"),
        bgNode: d.querySelector(".picture-book-bg"),
        navNode: d.querySelector(".raiseZIndex"),
        pages: [].map.call(d.querySelectorAll(".picture-book-page"), function(page) { return {node: page}; })
      };
    });

    this.scroll = function() {
      // console.time("scroll");
      var that = this;
      var cachedScrollY = getScrollY();
      var isFixed = false;
      var anyActiveBook = false;
      this.scan(); 
      this.books.forEach(function(book, bi) {

        var topDistance    = cachedScrollY - scrollYAtScan - book.rect.top + 94,
            bottomDistance = cachedScrollY - scrollYAtScan - book.rect.bottom + (book.bgRect.height + 200);

        // Background fixing
        // Top
        if (topDistance <= 0 && bottomDistance <= 0) {
          book.bgNode.classList.remove("picture-book-bg-fixed");
          book.bgNode.classList.remove("picture-book-bg-bottom");
          book.navNode.classList.remove("raiseZIndex-bg-fixed");
          book.navNode.classList.remove("raiseZIndex-bg-bottom");
        // Bottom
        } else if (bottomDistance > 0) {
          book.bgNode.classList.remove("picture-book-bg-fixed");
          book.bgNode.classList.add("picture-book-bg-bottom");
          book.navNode.classList.remove("raiseZIndex-bg-fixed");
          book.navNode.classList.add("raiseZIndex-bg-bottom");
        // Fixed
        } else {
          that.activeBook = book;
          anyActiveBook = true;
          isFixed = true;
          book.bgNode.classList.add("picture-book-bg-fixed");
          book.bgNode.classList.remove("picture-book-bg-bottom");
          book.navNode.classList.add("raiseZIndex-bg-fixed");
          book.navNode.classList.remove("raiseZIndex-bg-bottom");


          // Pages
          if (book.pages.length) {

            var fp = book.pages[0];
            var lp = book.pages[book.pages.length-1];

            fp.pxPosition = fp.rect.middle-book.rect.top;
            lp.pxPosition = lp.rect.middle-book.rect.top;

            var bookProgressPx = topDistance - fp.pxPosition + book.bgRect.height/2;
            var bookLengthPx   = (book.rect.height - fp.pxPosition) - (book.rect.height-lp.pxPosition);

            book.progress = bookProgressPx/bookLengthPx;

            book.minIndex = 0;
            book.pages.forEach(function(page, pi) {

              var topDistance    = cachedScrollY - scrollYAtScan - page.rect.top    + innerHeight * screenMeasure,
                  midDistance    = cachedScrollY - scrollYAtScan - (page.rect.top+page.rect.height/2) + innerHeight * screenMeasure,
                  bottomDistance = cachedScrollY - scrollYAtScan - page.rect.bottom + innerHeight * screenMeasure;


              page.progress = (page.rect.top+page.rect.height/2)/innerHeight;
              page.midDistance = midDistance;
              if (bottomDistance >= 0) {
                page.distance = bottomDistance;
                book.minIndex = pi;
              } else if (topDistance <= 0) {
                page.distance = topDistance;
              } else if (topDistance > 0 && bottomDistance < 0) {
                page.distance = 0;
                book.minIndex = pi;
              }
            });

            book.maxIndex  = Math.min(book.minIndex + 1, book.pages.length - 1);

            book.minPage   = book.pages[book.minIndex];
            book.maxPage   = book.pages[book.maxIndex];

            book.remainder = book.minIndex === book.maxIndex ? 0 : 1 - Math.max(0, - book.minPage.distance / (book.maxPage.distance - book.minPage.distance));
            book.middleRemainder = book.minIndex === book.maxIndex ? 0 : 1 - Math.max(0, book.minPage.midDistance / innerHeight );

            book.remainder = that.easeInOutQuad(book.remainder);

            that.activePage = book.minPage;
            that.update(that.activePage);

          }
        }

      });

      if (!anyActiveBook) that.activeBook = null;

      // console.timeEnd("scroll");
    };

    this.scan = function() {
      scrollYAtScan = getScrollY();
      this.books.forEach(function(book) {
        book.rect = book.node.getBoundingClientRect();
        book.bgRect = book.bgNode.getBoundingClientRect();
        book.pages.forEach(function(page) {
          page.rect = page.node.getBoundingClientRect();
          page.rect.middle = (page.rect.top+page.rect.height/2);
          page.attributes = {};
        });
          // book.progress=(topDistance-book.bgRect.height/2)/(book.rect.height-book.bgRect.height*2);
        var fp = book.pages[0];
        var lp = book.pages[book.pages.length-1];

        book.pages.forEach(function(page) {
          // page.position = (page.rect.middle-book.rect.top)/book.rect.height;

          var attributes = page.node.attributes;

          for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            var pictureBookAttribute = attribute.name.match(/^(data-pb-)(.*)$/);

            if (pictureBookAttribute) {
              var newName = pictureBookAttribute[2];
              page.attributes[newName] = attribute.value;
            }
          };

          page.position = (page.rect.middle-fp.rect.middle) / (lp.rect.middle-fp.rect.middle);

          var pageOffsets = ( innerHeight * (screenMeasure-0.5) );          
          page.position -= pageOffsets / (lp.rect.middle - fp.rect.middle);

          page.node.setAttribute("data-pb-pos",page.position)
        })
      });
    }

    this.resize = function() {
      this.scan();
      this.scroll();
    }

    this.easeLinear = function(t) { return t; }
    this.easeInOutSinusoidal = function(t) { return (Math.sin(t * Math.PI - Math.PI / 2) + 1) / 2; }
    this.easeInQuad = function(t) { return t * t; }
    this.easeOutQuad = function(t) { return 1 - this.easeInQuad(1 - t); }
    this.easeInOutQuad = function(t) { return (t < 0.5) ? this.easeInQuad(t * 2) / 2 : 1 - this.easeInQuad((1 - t) * 2) / 2; }
    this.easeInCubic = function(t) { return Math.pow(t, 3); }
    this.easeOutCubic = function(t) { return 1 - this.easeInCubic(1 - t); }
    this.easeInOutCubic = function(t) { return (t < 0.5) ? this.easeInCubic(t * 2) / 2 : 1 - this.easeInCubic((1 - t) * 2) / 2; }


    // could wrap this in an init function
    var that = this;
    document.addEventListener("scroll", function() { that.scroll(); }, false);
    document.addEventListener("resize", function() { that.resize(); }, false);

    this.scan();


    this.books.forEach(function(book) {
      that.initBook(book);
      that.ready(book);
    });
      
    this.scroll(); // just in case user starts in middle of the page, give it an initial scroll event
};

app.numberWithCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

app.ordinal_suffix_of = function (i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}


// color ranges for text. Set domains based on data above
app.speedTextColorScale = d3.scale.quantize()
  .range(["#a94442","#a50026","#d73027","#f46d43","#fdae61","#a6d96a","#66bd63","#1a9850","#006837","#3c763d"]);

app.ridershipTextColorScale = d3.scale.quantize()
  .range(["#a94442","#a50026","#d73027","#f46d43","#fdae61","#a6d96a","#66bd63","#1a9850","#006837","#3c763d"]);

app.ridershipRankingTextColorScale = d3.scale.quantize()
  .range(["#3c763d", "#006837","#1a9850","#66bd63","#a6d96a","#fdae61","#f46d43","#d73027","#a50026","#a94442"]);

app.ridershipChangeTextColorScale = d3.scale.quantize()
  .range(["#a94442","#a50026","#d73027","#f46d43","#fdae61","#a6d96a","#66bd63","#1a9850","#006837","#3c763d"]);

app.bunchTextColorScale = d3.scale.quantize()
  .range(["#3c763d", "#006837","#1a9850","#66bd63","#a6d96a","#fdae61","#f46d43","#d73027","#a50026","#a94442"]);

app.bus1ColorScale = d3.scale.quantize()
  .range(["#3c763d", "#006837","#1a9850","#66bd63","#a6d96a","#fdae61","#f46d43","#d73027","#a50026","#a94442"]);

app.bus2ColorScale = d3.scale.quantize()
  .range(["#3c763d", "#006837","#1a9850","#66bd63","#a6d96a","#fdae61","#f46d43","#d73027","#a50026","#a94442"]);

app.bus3ColorScale = d3.scale.quantize()
  .range(["#3c763d", "#006837","#1a9850","#66bd63","#a6d96a","#fdae61","#f46d43","#d73027","#a50026","#a94442"]);

app.bus4ColorScale = d3.scale.quantize()
  .range(["#3c763d", "#006837","#1a9850","#66bd63","#a6d96a","#fdae61","#f46d43","#d73027","#a50026","#a94442"]);

app.bus5ColorScale = d3.scale.quantize()
  .range(["#3c763d", "#006837","#1a9850","#66bd63","#a6d96a","#fdae61","#f46d43","#d73027","#a50026","#a94442"]);

app.bus1MarginScale = d3.scale.linear()
  .range([30, 2]);

app.bus2MarginScale = d3.scale.linear()
  .range([30, 2]);

app.bus3MarginScale = d3.scale.linear()
  .range([30, 2]);

app.bus4MarginScale = d3.scale.linear()
  .range([30, 2]);

app.bus5MarginScale = d3.scale.linear()
  .range([30, 2]);


// share buttons
app.updateShareButtons = function (route_id) {
  // set up twitter and facebook URLs
  var app_id = '1581540325487727';
  var fbdescription = "Here's the report card for the " + route_id + " bus in NYC. Check out and compare your bus here! #busturnaround";
  var fblink = "http://busturnaround.nyc/?route="+route_id;
  var fbpicture = "http://busturnaround.nyc/static/website/css/images/report_card_fb.png";
  var fbname = "This is the report card for the "+route_id;
  var fbcaption = "TransitCenter";
  var fbUrl = 'https://www.facebook.com/dialog/feed?app_id=' + app_id + '&display=popup&description='+ encodeURIComponent(fbdescription) + '&link=' + encodeURIComponent(fblink) + '&redirect_uri=' + encodeURIComponent(fblink) + '&name=' + encodeURIComponent(fbname) + '&caption=' + encodeURIComponent(fbcaption) + '&picture=' + encodeURIComponent(fbpicture);
  var fbOnclick = 'window.open("' + fbUrl + '","facebook-share-dialog","width=626,height=436");return false;';
  //$('#showShareFB').attr("href", fbUrl);
  $('#showShareFB').attr("onclick", fbOnclick);


  var twitterlink = "http://busturnaround.nyc/?route="+route_id;
  var via = 'TransitCenter';
  var twittercaption = "Here's the report card for the " + route_id + " bus in NYC. Check out your bus here! #busturnaround";
  var twitterUrl = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(twitterlink) + '&via='+ encodeURIComponent(via) + '&text=' + encodeURIComponent(twittercaption);
  var twitterOnclick = 'window.open("' + twitterUrl + '","twitter-share-dialog","width=626,height=436");return false;';
  //$('#showShareTwitter').attr("href", twitterUrl);
  $('#showShareTwitter').attr("onclick", twitterOnclick);
}


