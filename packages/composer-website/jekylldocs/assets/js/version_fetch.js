/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

$(document).ready(function() {
    $.ajax({
        url: 'https://api.github.com/repos/hyperledger/composer/releases',
        data: {
           format: 'json'
        },
        error: function() {
           console.log("Uh Oh, Error fetching Versions")
        },
        dataType: 'jsonp',
        success: function(data) {
           parseVersionResponse(data);
        },
        type: 'GET'
     });
});

/**
 * Parses the json response from the GitHubAPI endpoint
 * and then append the 4 most recent release options
 * to the #version input
 *
 * @param {JSON} JSON object containing information on repo by tag.
 */
function parseVersionResponse(response) {
    var versionArr = response.data;

    // Sorting required due to the possibillity of older versions being revisted, and updated thorwing off response order reliabillity. ex. v0.16.6
    var sortedArr = versionArr.map(x => x["tag_name"].slice(1)).sort().reverse();
    for (var i = 0; i < 4; i++) {
        switch (i) {
            case 0:
                $("#version").prepend(
                    $("<option>").attr(
                        "value",
                        "/composer/next-unstable/introduction/introduction.html"
                    ).attr(
                        "title",
                        "The closest to the development stream of Composer, expect breaking changes"
                    ).text(
                        "Next-Unstable" + " (v" + sortedArr[0] + ")"
                    )
                );
                break;
            case 1:
                $("#version").prepend(
                    $("<option>").attr(
                        "value",
                        "/composer/next/introduction/introduction.html"
                    ).attr(
                        "title",
                        "The most ready version of the next generation of Composer, new features (possibly breaking) and many fixes"
                    ).text(
                        "Next" + " (v" + sortedArr[1] + ")"
                    )
                );
                break;
            case 2:
                $("#version").prepend(
                    $("<option>").attr(
                        "value",
                        "/composer/unstable/introduction/introduction.html"
                    ).attr(
                        "title",
                        "The version that will replace Latest"
                    ).text(
                        "Latest-Unstable" + " (v" + sortedArr[2] + ")"
                    )
                );
                break;
            case 3:
                $("#version").prepend(
                    $("<option>").attr(
                        "value",
                        "/composer/latest/introduction/introduction.html"
                    ).attr(
                        "title",
                        "The most stable version of Composer"
                    ).text(
                        "Latest" + " (v" + sortedArr[3] + ")"
                    )
                );
                break;
        }
    }
    $("#version").prepend(
        $("<option  selected disabled hidden>").text(
            "Select version"
        )
    );
}
