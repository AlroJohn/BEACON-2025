import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface TermsModalProps {
  trigger?: React.ReactNode;
}

export function TermsModal({ trigger }: TermsModalProps) {
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      View Terms & Conditions
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            BEACON 2025 - Terms and Conditions
          </DialogTitle>
          <DialogDescription>
            Registration Terms for the Maritime Industry Event
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 overflow-y-auto scroll-none">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h3 className="text-lg font-semibold mb-3">
                1. Event Registration
              </h3>
              <p className="mb-2">
                By registering for BEACON 2025, you agree to comply with all
                terms and conditions set forth by the event organizers.
                Registration is subject to approval and availability.
              </p>
              <p>
                All information provided during registration must be accurate
                and complete. False or misleading information may result in
                cancellation of registration without refund.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                2. Event Access and Participation
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Valid registration confirmation is required for event entry
                </li>
                <li>
                  Participants must present valid identification upon request
                </li>
                <li>
                  Event organizers reserve the right to refuse entry or remove
                  participants
                </li>
                <li>
                  Access to specific sessions may be limited based on capacity
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                3. Data Privacy and Protection
              </h3>
              <p className="mb-2">
                Your personal information will be collected, stored, and
                processed in accordance with applicable data protection laws. We
                are committed to protecting your privacy and will not share your
                personal information with third parties without your consent,
                except as required by law.
              </p>
              <p>Registration data may be used for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Event management and communication</li>
                <li>Safety and security purposes</li>
                <li>Post-event surveys and feedback</li>
                <li>Future event notifications (with your consent)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                4. Photography and Media
              </h3>
              <p>
                By attending BEACON 2025, you consent to photography, video
                recording, and other media capture during the event. These
                materials may be used for promotional purposes, including but
                not limited to websites, social media, marketing materials, and
                future event promotion.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                5. Health and Safety
              </h3>
              <p className="mb-2">
                Participants are expected to follow all health and safety
                guidelines established by the event organizers and venue. This
                includes but is not limited to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Following emergency procedures and evacuation protocols</li>
                <li>Reporting any incidents or safety concerns immediately</li>
                <li>Complying with venue-specific safety requirements</li>
                <li>Maintaining appropriate professional conduct</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                6. Intellectual Property
              </h3>
              <p>
                All event content, presentations, materials, and intellectual
                property remain the property of their respective owners.
                Unauthorized recording, reproduction, or distribution of event
                content is strictly prohibited without prior written consent.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                7. Liability and Indemnification
              </h3>
              <p className="mb-2">
                Participants attend BEACON 2025 at their own risk. Event
                organizers, sponsors, and venue owners shall not be held liable
                for any personal injury, property damage, or loss that may occur
                during the event.
              </p>
              <p>
                Participants agree to indemnify and hold harmless the event
                organizers from any claims, damages, or expenses arising from
                their participation in the event.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                8. Cancellation and Refund Policy
              </h3>
              <p className="mb-2">
                Event organizers reserve the right to cancel, postpone, or
                modify the event due to circumstances beyond their control,
                including but not limited to natural disasters, government
                regulations, or other force majeure events.
              </p>
              <p>
                In case of event cancellation by organizers, registered
                participants will be notified and appropriate arrangements will
                be made. Refund policies will be communicated separately.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Code of Conduct</h3>
              <p className="mb-2">
                All participants are expected to maintain professional standards
                and respectful behavior. Harassment, discrimination, or
                disruptive conduct will not be tolerated and may result in
                removal from the event.
              </p>
              <p>
                BEACON 2025 is committed to providing a safe, inclusive, and
                welcoming environment for all participants regardless of
                background, identity, or affiliation.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">10. Governing Law</h3>
              <p>
                These terms and conditions shall be governed by and construed in
                accordance with the laws of the jurisdiction where the event is
                held. Any disputes arising from these terms shall be subject to
                the exclusive jurisdiction of the competent courts.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                11. Contact Information
              </h3>
              <p>
                For questions regarding these terms and conditions or the event,
                please contact:
              </p>
              <div className="mt-2 p-3 dark:bg-muted-foreground/30 bg-muted rounded-md">
                <p>
                  <strong>BEACON 2025 Organizing Committee</strong>
                </p>
                <p>Email: info@beacon2025.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Website: www.beacon2025.com</p>
              </div>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="text-xs text-muted-foreground">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                By proceeding with registration, you acknowledge that you have
                read, understood, and agree to be bound by these terms and
                conditions.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
