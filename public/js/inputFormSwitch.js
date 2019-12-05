
        /* attach a submit handler to the form */
        $("#formoid").submit(function (event) {

            /* stop form from submitting normally */
            event.preventDefault();

            /* get the action attribute from the <form action=""> element */
            var $form = $(this),
                url = $form.attr('action');

            /* Send the data using post with element id name and name2*/
            var data = {
                opportunity: {
                    streetAddress: $('#streetAddress').val(),
                    postalCode: $('#postalCode').val(),
                    city: $('#city').val(),
                    country: $('#country').val()
                }
            }

            $.post(url, data, function () {
                console.log('posted!')
                $('#thisOne').toggle();
                $("#formoid").toggle();

            });
        });

