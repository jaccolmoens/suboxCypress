import {
  getReservation,
  cancelReservation,
  returnReservationLine,
  inspectionReservationLine,
  finishReservation,
} from "../api/reservationsAPI";

export function cleanupReservation(id) {
  return getReservation(id).then((response) => {
    expect(response.status).to.equal(200);
    const reservation = response.body;
    if (
      reservation.status === "completed" ||
      reservation.status === "rejected"
    ) {
      return;
    }

    if (
      reservation.status === "requested" ||
      reservation.status === "confirmed"
    ) {
      return cancelReservation(reservation.id, reservation.version).then(
        (cancelResponse) => {
          expect(cancelResponse.status).to.equal(200);
        },
      );
    }

    if (reservation.status === "issued") {
      const line = reservation.lines.find((line) => {
        return line.issuedAt && !line.returnedAt;
      });

      expect(line, "uitgegeven koffer die nog niet retour is").to.exist;

      return returnReservationLine(
        reservation.id,
        line.id,
        reservation.version,
      ).then((returnResponse) => {
        expect(returnResponse.status).to.equal(200);
        return cleanupReservation(id);
      });
    }

    if (reservation.status === "returned") {
      const line = reservation.lines.find((line) => {
        return line.returnedAt && !line.inspectedAt;
      });

      if (line) {
        return inspectionReservationLine(
          reservation.id,
          line.id,
          reservation.version,
        ).then((inspectionResponse) => {
          expect(inspectionResponse.status).to.equal(200);

          return cleanupReservation(id);
        });
      }

      return finishReservation(reservation.id, reservation.version).then(
        (finishResponse) => {
          expect(finishResponse.status).to.equal(200);

          return cleanupReservation(id);
        },
      );
    }
  });
}
