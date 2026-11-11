import { getRentalProfile } from "../api/casesApi";
import { updateRentalProfile } from "../api/casesApi";

export function configureRentalProfile(recordId, profileData) {
  return getRentalProfile(recordId).then((profileResponse) => {
    expect(profileResponse.status).to.equal(200);
    expect(profileResponse.body.enabled).to.equal(false);

    return updateRentalProfile(
      recordId,
      profileResponse.body.version,
      profileData,
    ).then((updateResponse) => {
      expect(updateResponse.status).to.equal(200);
      expect(updateResponse.body.enabled).to.equal(true);
    });
  });
}
