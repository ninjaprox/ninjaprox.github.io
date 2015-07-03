(function($) {
    $.fn.segmentedSlider = function(onChange) {
        var pointContainer = this.find(".point-container");
        var leftPadding = +pointContainer.css("padding-left").replace("px", "");
        var rightPadding = +pointContainer.css("padding-right").replace("px", "");
        var points = pointContainer.find("li");
        var greenSegment = this.find(".segment.green");
        var amberSegment = this.find(".segment.amber");
        var redSegment = this.find(".segment.red");
        var greenHandle = this.find(".handle.green");
        var amberHandle = this.find(".handle.amber");
        var handleWidth = greenHandle.width();
        var startPosition = leftPadding;
        var endPosition = leftPadding + pointContainer.width();
        var pointInterval = pointContainer.width() / (points.length - 1);
        var greenPoint = this.data("init-green") || $.fn.segmentedSlider.initGreen;
        var amberPoint = this.data("init-amber") || $.fn.segmentedSlider.initAmber;

        (function init() {
            rearrangePoints();
            setHandleDraggable();

            // Set initial position of handles
            setPoint(greenHandle, greenPoint);
            setPoint(amberHandle, amberPoint);
        }());


        function rearrangePoints() {
            points.each(function(index) {
                var jObject = $(this);
                var x = leftPadding + pointInterval * index - jObject.width() / 2;

                jObject.css("left", x);
            })
        }

        function setHandleDraggable() {
            greenHandle.drag(function(ev, dd) {
                var x = checkBoundary(dd.offsetX);
                var tempGreenPoint = convertPositionToPoint(x);

                greenPoint = (tempGreenPoint <= amberPoint) ? tempGreenPoint : amberPoint;
                setPoint(greenHandle, greenPoint);
            }, {
                relative: true
            });
            amberHandle.drag(function(ev, dd) {
                var x = checkBoundary(dd.offsetX);
                var tempAmberPoint = convertPositionToPoint(x);

                amberPoint = (tempAmberPoint >= greenPoint) ? tempAmberPoint : greenPoint;
                setPoint(amberHandle, amberPoint);
            }, {
                relative: true
            });
        }

        // Helpers
        function checkBoundary(x) {
            if (x + handleWidth / 2 < startPosition) {
                return startPosition - handleWidth / 2;
            } else if (x + handleWidth / 2 > endPosition) {
                return endPosition - handleWidth / 2;
            }

            return x;
        }

        function convertPointToPosition(point, center) {
            var position = startPosition;

            position += (point) / 10 * pointInterval;
            if (center === undefined || !center) {
                position -= handleWidth / 2;
            }

            return position;
        }

        function convertPositionToPoint(position) {
            return (position + handleWidth / 2 - startPosition) / pointInterval * 10
        }

        function setPoint(handle, point) {
            handle.css({
                left: convertPointToPosition(point)
            });
            updateSegments();
            if (onChange && typeof onChange === "function") {
                onChange(greenPoint, amberPoint);
            }
        }

        function updateSegments() {
            var greenPosition = convertPointToPosition(greenPoint, true);
            var amberPosition = convertPointToPosition(amberPoint, true);

            greenSegment.css({
                width: greenPosition
            });
            amberSegment.css({
                left: greenPosition,
                width: amberPosition - greenPosition
            });
            redSegment.css({
                left: amberPosition,
                width: endPosition + leftPadding - amberPosition
            });
        }
    }

    $.fn.segmentedSlider.defaults = {
        initGreen: 10,
        initAmber: 50
    };
}(jQuery));