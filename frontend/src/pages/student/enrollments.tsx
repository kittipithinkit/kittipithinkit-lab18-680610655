import { useState } from "react";
import { ArrowRightLeft, PlusCircle } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/auth-store";
import { useEnrollmentStore } from "@/lib/enrollment-store";

export default function StudentEnrollmentsPage() {
  const studentId = useAuthStore((s) => s.studentId);
  const {
    students,
    courses,
    enrollments,
    enroll,
    updateEnrollment,
    dropEnrollment,
  } = useEnrollmentStore();

  const [open, setOpen] = useState(false);
  const [formCourse, setFormCourse] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [changeOpenFor, setChangeOpenFor] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSubmitting, setChangeSubmitting] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const me = students.find((s) => s.studentId === studentId);
  const myEnrollments = enrollments.filter((e) => e.studentId === studentId);

  const courseOptions = courses
    .filter((c) => !myEnrollments.some((e) => e.courseId === c.courseId))
    .map((c) => ({
      value: c.courseId,
      label: `${c.courseId} — ${c.courseTitle}`,
    }));

  const courseOf = (courseId: string) =>
    courses.find((c) => c.courseId === courseId);

  const changeCourseOptions = (currentCourseId: string) =>
    courses
      .filter(
        (course) =>
          course.courseId !== currentCourseId &&
          !myEnrollments.some((enrollment) => enrollment.courseId === course.courseId),
      )
      .map((course) => ({
        value: course.courseId,
        label: `${course.courseId} — ${course.courseTitle}`,
      }));

  const handleChangeCourse = async (currentCourseId: string) => {
    if (!studentId || !newCourse) return;
    setChangeSubmitting(true);
    setChangeError(null);
    try {
      await updateEnrollment(studentId, currentCourseId, newCourse);
      setChangeOpenFor(null);
      setNewCourse(null);
    } catch (err) {
      setChangeError((err as Error).message);
    } finally {
      setChangeSubmitting(false);
    }
  };

  const handleDrop = async (courseId: string) => {
    if (!studentId) return;
    setDropError(null);
    try {
      await dropEnrollment(studentId, courseId);
    } catch (err) {
      setDropError((err as Error).message);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setFormCourse(null);
      setServerError(null);
    }
  };

  const handleEnroll = async () => {
    if (!studentId || !formCourse) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await enroll(studentId, formCourse);
      handleOpenChange(false);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">จัดการการลงทะเบียน</h1>
          <p className="text-sm text-muted-foreground">
            {me
              ? `${me.studentId} — ${me.firstName} ${me.lastName} (${me.program})`
              : (studentId ?? "-")}{" "}
            · ลงทะเบียนแล้ว {myEnrollments.length} วิชา
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button disabled={!studentId} />}>
            <PlusCircle className="h-4 w-4" />
            ลงทะเบียนเรียน
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>ลงทะเบียนเรียน</DialogTitle>
              <DialogDescription>
                เลือกวิชาที่ยังไม่ได้ลงทะเบียน
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="formCourse">วิชา</Label>
              <Select
                items={courseOptions}
                value={formCourse}
                onValueChange={(v) => setFormCourse(v as string)}
              >
                <SelectTrigger id="formCourse" className="w-full">
                  <SelectValue
                    placeholder={
                      courseOptions.length === 0
                        ? "ลงทะเบียนครบทุกวิชาแล้ว"
                        : "เลือกวิชา"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <DialogFooter>
              <Button
                disabled={!formCourse || submitting}
                onClick={handleEnroll}
              >
                <PlusCircle className="h-4 w-4" />
                {submitting ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        {dropError && (
          <p className="border-b p-3 text-sm text-destructive">
            ยกเลิกการลงทะเบียนไม่สำเร็จ: {dropError}
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัสวิชา</TableHead>
              <TableHead>ชื่อวิชา</TableHead>
              <TableHead>ผู้สอน</TableHead>
              <TableHead>วันที่ลงทะเบียน</TableHead>
              <TableHead className="w-24 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myEnrollments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-20 text-center text-muted-foreground"
                >
                  ยังไม่ได้ลงทะเบียนวิชาใด
                </TableCell>
              </TableRow>
            )}
            {myEnrollments.map((e) => {
              const course = courseOf(e.courseId);
              return (
                <TableRow key={e.courseId}>
                  <TableCell>{e.courseId}</TableCell>
                  <TableCell>{course?.courseTitle ?? "-"}</TableCell>
                  <TableCell>{course?.instructors.join(", ") || "-"}</TableCell>
                  <TableCell>
                    {e.enrolledAt
                      ? new Date(e.enrolledAt).toLocaleString("th-TH")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={changeOpenFor === e.courseId}
                      onOpenChange={(next) => {
                        setChangeOpenFor(next ? e.courseId : null);
                        if (!next) {
                          setNewCourse(null);
                          setChangeError(null);
                        }
                      }}
                    >
                      <DialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`เปลี่ยนวิชา ${e.courseId}`}
                          />
                        }
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>เปลี่ยนวิชา</DialogTitle>
                          <DialogDescription>
                            เลือกวิชาใหม่แทน {e.courseId} — {course?.courseTitle ?? ""}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`newCourse-${e.courseId}`}>วิชาใหม่</Label>
                          <Select
                            items={changeCourseOptions(e.courseId)}
                            value={newCourse}
                            onValueChange={(value) => setNewCourse(value as string)}
                          >
                            <SelectTrigger id={`newCourse-${e.courseId}`} className="w-full">
                              <SelectValue placeholder="เลือกวิชาใหม่" />
                            </SelectTrigger>
                            <SelectContent>
                              {changeCourseOptions(e.courseId).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {changeError && (
                          <p className="text-sm text-destructive">{changeError}</p>
                        )}
                        <DialogFooter>
                          <Button
                            disabled={!newCourse || changeSubmitting}
                            onClick={() => handleChangeCourse(e.courseId)}
                          >
                            {changeSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <ConfirmDeleteButton
                      label={`ยกเลิกการลงทะเบียน ${e.courseId}`}
                      title={`ยกเลิกวิชา ${e.courseId}?`}
                      description={`${course?.courseTitle ?? "วิชานี้"} จะถูกนำออกจากรายการลงทะเบียนของคุณ`}
                      onConfirm={() => handleDrop(e.courseId)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
